import React, { useEffect, useState, useRef } from "react";
import {
    Chip,
    Tooltip,
    ThemeProvider,
    createTheme,
} from '@mui/material';
import {Search, Preview, CallMade} from '@mui/icons-material';
import PostCard from "./PostCard.js";

const COMMAND_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

const getMessageTimestamp = (msgId) => {
    return parseInt(msgId.split('-')[0]);
};

const isMessageExpired = (msgId) => {
    const timestamp = getMessageTimestamp(msgId);
    return Date.now() - timestamp > COMMAND_EXPIRY_TIME;
};

const cleanupExecutedCommands = () => {
    const executedCommandMessages = JSON.parse(localStorage.getItem('executedCommandMessages') || '{}');
    const now = Date.now();

    // Filter out expired messages
    const cleanedCommands = Object.entries(executedCommandMessages).reduce((acc, [msgId, value]) => {
        if (now - getMessageTimestamp(msgId) <= COMMAND_EXPIRY_TIME) {
            acc[msgId] = value;
        }
        return acc;
    }, {});

    localStorage.setItem('executedCommandMessages', JSON.stringify(cleanedCommands));
};

const isCommandExecuted = (msgId) => {
    const executedCommandMessages = JSON.parse(localStorage.getItem('executedCommandMessages') || '{}');
    return executedCommandMessages[msgId];
};

// Helper function to mark command as executed
const markCommandAsExecuted = (msgId) => {
    const executedCommandMessages = JSON.parse(localStorage.getItem('executedCommandMessages') || '{}');
    executedCommandMessages[msgId] = true;
    localStorage.setItem('executedCommandMessages', JSON.stringify(executedCommandMessages));
};

// Helper function to execute command
const executeCommand = (command, args, kbId) => {
    // Prepare the command message
    const commandMessage = {
        type: 'openkbsCommand',
        command: command,
        kbId,
        ...args
    };

    // Send the command to the parent window
    window.parent.postMessage(commandMessage, '*');
};

const Header = ({ setRenderSettings }) => {
    useEffect(() => {
        setRenderSettings({
            disableCodeExecuteButton: true,
            inputLabelsQuickSend: true,
        });
    }, [setRenderSettings]);
};

const ChatMessageRenderer = ({ content, msgId, kbId }) => {
    const timeoutId = useRef(null);

    useEffect(() => {
        const executeCommands = () => {
            cleanupExecutedCommands();
            if (isMessageExpired(msgId) || isCommandExecuted(msgId)) return;

            // Parse and execute commands
            const lines = content.split('\n');
            let hasExecution = false;
            lines.forEach(line => {
                const navigateMatch = /\/navigate\("([^"]*)"\)/g.exec(line);
                const clickMatch = /\/click\("([^"]*)"\)/g.exec(line);

                if (navigateMatch) {
                    hasExecution = true;
                    executeCommand('navigate', { url: navigateMatch[1] }, kbId);
                }
                if (clickMatch) {
                    hasExecution = true;
                    executeCommand('click', { selector: clickMatch[1] }, kbId);
                }
            });

            // Mark message as executed if it contained commands
            if (hasExecution) markCommandAsExecuted(msgId);
        };

        if (timeoutId.current) clearTimeout(timeoutId.current);

        // Postpone execution until LLM completes content generation
        timeoutId.current = setTimeout(executeCommands, 1000);

        // Cleanup function
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [content, msgId, kbId]);

    const output = [];
    content.split('\n').forEach(line => {
        const commandMatch = /\/(?<command>wpSearch|renderPostCard|webpageToText|documentToText|imageToText|navigate|click)\((?<args>[^()]*)\)/g.exec(line);
        if (commandMatch) {
            const command = commandMatch?.groups?.command;
            let args = commandMatch?.groups?.args;
            output.push({ command, args, line });
        } else {
            output.push(line);
        }
    });

    return <ThemeProvider theme={() => createTheme(window.openkbsTheme)}>
        {output.map((o, i) => {
        if (typeof o === 'string') {
            return <p key={i} style={{ marginTop: '0px', marginBottom: '0px' }}>{o}</p>;
        } else if (o.command) {
            const commandIcons = {
                'wpSearch': <Search />,
                'webpageToText': <Preview />,
            };

            if (o.command === 'wpSearch') o.args = o.args.match(/"([^"]*)"/)[1] // render only search query

            if (o.command === 'renderPostCard') {
                const [title, url, imageUrl, price] = o.args
                    .split(',')
                    .map(arg => arg.trim().replace(/^"|"$/g, ''));

                return (
                    <div key={i} style={{ marginTop: '5px', marginBottom: '5px' }}>
                        <PostCard
                            title={title}
                            url={url}
                            imageUrl={imageUrl}
                            price={price}
                        />
                    </div>
                );
            }

            const icon = commandIcons[o.command];
            return <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Tooltip title={o.line} placement="right">
                    <Chip
                        sx={{mt: '10px'}}
                        icon={icon}
                        label={o.args}
                        variant="outlined"
                        deleteIcon={ <CallMade
                            style={{
                                fontSize: 12,
                                borderRadius: '50%',
                                padding: '4px',
                            }}
                        /> }
                        onDelete={() => {}}
                    />
                </Tooltip>
            </div>

        }
    })}
    </ThemeProvider>
};

const onRenderChatMessage = async (params) => {
    const { content, msgId } = params.messages[params.msgIndex];
    const { setInputValue, sendButtonRippleRef, KB } = params;

    if (content.match(/\/(?<command>\w+)\(([\s\S]*)\)/g)) {
        return (
            <ChatMessageRenderer
                content={content}
                msgId={msgId}
                kbId={KB?.kbId}
                setInputValue={setInputValue}
                sendButtonRippleRef={sendButtonRippleRef}
            />
        );
    }
};

const exports = { onRenderChatMessage, Header };
window.contentRender = exports;
export default exports;
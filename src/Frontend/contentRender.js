import React, { useEffect, useState, useRef } from "react";
import {
    Chip,
    Tooltip,
    ThemeProvider,
    createTheme,
} from '@mui/material';
import { Search, Preview, CallMade } from '@mui/icons-material';
import PostCard from "./PostCard.js";
import {
    executeCommand,
    isMessageExpired,
    cleanupExecutedCommands,
    isCommandExecuted,
    markCommandAsExecuted
} from "./utils";


const Header = ({ setRenderSettings }) => {
    useEffect(() => {
        setRenderSettings({
            disableCodeExecuteButton: true,
            inputLabelsQuickSend: true,
            disableChatModelsSelect: true
        });
    }, [setRenderSettings]);
};

const ChatMessageRenderer = ({ content, msgId, kbId }) => {
    const [executionInProgress, setExecutionInProgress] = useState(false);
    const timeoutId = useRef(null);

    useEffect(() => {
        const executeCommands = async () => {
            if (isMessageExpired(msgId) || executionInProgress) return;
            cleanupExecutedCommands();

            // Parse commands from content
            const lines = content.split('\n');
            const commands = lines
                .map((line, index) => {
                    const navigateMatch = /\/navigate\("([^"]*)"\)/g.exec(line);
                    const clickMatch = /\/click\("([^"]*)"\)/g.exec(line);

                    if (navigateMatch) {
                        return { type: 'navigate', args: { url: navigateMatch[1] }, index };
                    }
                    if (clickMatch) {
                        return { type: 'click', args: { selector: clickMatch[1] }, index };
                    }
                    return null;
                })
                .filter(cmd => cmd !== null);

            if (commands.length === 0) return;

            setExecutionInProgress(true);

            // Execute commands sequentially
            for (const command of commands) {
                if (!isCommandExecuted(msgId, command.index)) {
                    try {
                        markCommandAsExecuted(msgId, command.index);
                        await executeCommand(command.type, command.args, kbId);
                    } catch (error) {
                        console.error('Command execution failed:', error);
                    }
                }
            }

            setExecutionInProgress(false);
        };

        // Clear any existing timeout
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        // Postpone execution until LLM completes content generation
        timeoutId.current = setTimeout(executeCommands, 1000);

        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [content, msgId, kbId, executionInProgress]);

    const output = [];
    content.split('\n').forEach(line => {
        const renderPostMatch = /\/renderPostCard\("([^"]*)",\s*"([^"]*)"(?:,\s*"([^"]*)")?(?:,\s*"([^"]*)")?\)/g.exec(line);
        const commandMatch = renderPostMatch || /\/(?<command>wpSearch|webpageToText|documentToText|imageToText|navigate|click)\((?<args>[^()]*)\)/g.exec(line);

        if (commandMatch) {
            const command = renderPostMatch ? 'renderPostCard' : commandMatch.groups?.command;
            const args = renderPostMatch
                ? commandMatch.slice(1).filter(Boolean).map(arg => `"${arg}"`).join(', ')
                : commandMatch.groups?.args;
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
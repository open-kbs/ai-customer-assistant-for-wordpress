import React, { useEffect, useState } from "react";
import {
    Chip,
    Tooltip,
    ThemeProvider,
    createTheme,
} from '@mui/material';
import {Search, Preview, CallMade} from '@mui/icons-material';
import PostCard from "./PostCard.js";

const Header = ({ setRenderSettings }) => {
    useEffect(() => {
        setRenderSettings({
            disableCodeExecuteButton: true,
            inputLabelsQuickSend: true,
        });
    }, [setRenderSettings]);
};

const ChatMessageRenderer = ({ content }) => {

    const output = [];
    content.split('\n').forEach(line => {
        const commandMatch = /\/(?<command>wpSearch|renderPostCard|webpageToText|documentToText|imageToText)\((?<args>[^()]*)\)/g.exec(line);
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
    const { content } = params.messages[params.msgIndex];
    const { CodeViewer, setInputValue, sendButtonRippleRef } = params;

    if (content.match(/\/(?<command>\w+)\(([\s\S]*)\)/g)) {
        return (
            <ChatMessageRenderer
                content={content}
                CodeViewer={CodeViewer}
                setInputValue={setInputValue}
                sendButtonRippleRef={sendButtonRippleRef}
            />
        );
    }
};

const exports = { onRenderChatMessage, Header };
window.contentRender = exports;
export default exports;
const COMMAND_EXPIRY_TIME = 1 * 60 * 1000;
const COMMAND_DELAY = 2000;

export const getMessageTimestamp = (msgId) => {
    return parseInt(msgId.split('-')[0]);
};

export const isMessageExpired = (msgId) => {
    const timestamp = getMessageTimestamp(msgId);
    return Date.now() - timestamp > COMMAND_EXPIRY_TIME;
};

const getExecutedCommands = () => {
    return JSON.parse(localStorage.getItem('executedCommands') || '{}');
};

export const cleanupExecutedCommands = () => {
    const executedCommands = getExecutedCommands();
    const now = Date.now();

    const cleanedCommands = Object.entries(executedCommands).reduce((acc, [msgId, commands]) => {
        if (now - getMessageTimestamp(msgId) <= COMMAND_EXPIRY_TIME) {
            acc[msgId] = commands;
        }
        return acc;
    }, {});

    localStorage.setItem('executedCommands', JSON.stringify(cleanedCommands));
};

export const isCommandExecuted = (msgId, commandIndex) => {
    const executedCommands = getExecutedCommands();
    return executedCommands[msgId]?.includes(commandIndex);
};

export const markCommandAsExecuted = (msgId, commandIndex) => {
    const executedCommands = getExecutedCommands();
    if (!executedCommands[msgId]) {
        executedCommands[msgId] = [];
    }
    executedCommands[msgId].push(commandIndex);
    localStorage.setItem('executedCommands', JSON.stringify(executedCommands));
};

// Modified command execution
export const executeCommand = (command, args, kbId) => {
    return new Promise((resolve) => {
        const commandMessage = {
            type: 'openkbsCommand',
            command: command,
            kbId,
            ...args
        };
        window.parent.postMessage(commandMessage, '*');
        setTimeout(resolve, COMMAND_DELAY);
    });
};

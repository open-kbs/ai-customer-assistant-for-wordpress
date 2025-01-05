import {getActions} from './actions.js';

export const handler = async (event) => {
    const meta = {};
    const actions = getActions(meta);
    const lastMessage = event.payload.messages[event.payload.messages.length - 1].content;

    const matchingActions = actions.reduce((acc, [regex, action]) => {
        const matches = [...lastMessage.matchAll(new RegExp(regex, 'g'))];
        matches.forEach(match => {
            acc.push(action(match));
        });
        return acc;
    }, []);

    if (matchingActions.length > 0) {
        try {
            const results = await Promise.all(matchingActions);
            return {
                type: 'RESPONSE',
                data: results,
                ...meta
            };
        } catch (error) {
            return {
                type: 'ERROR',
                error: error.message,
                ...meta
            };
        }
    }

    return { type: 'CONTINUE' };
};
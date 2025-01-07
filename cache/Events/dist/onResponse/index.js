/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __nccwpck_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  "handler": () => (/* binding */ handler)
});

;// CONCATENATED MODULE: ./actions.js
const getActions = (meta) => {
    const wpUrl = '{{secrets.wpUrl}}';
    const headers = { 'WP-API-KEY': '{{secrets.wpapiKey}}' };

    return [
        [/\/order\/(\d+)\/shipping\/([^\/]+)\/([^\/]+)/, async (match) => {
            try {
                const [_, orderId, field, value] = match;

                const orderCheck = await axios.get(`${wpUrl}/wp-json/wc/v3/orders/${parseInt(orderId)}`, {
                    headers,
                    params: {
                        customer: '{{variables.publicUserId}}'
                    }
                });

                if (!orderCheck.data || orderCheck.data.customer_id.toString() !== '{{variables.publicUserId}}') {
                    return { error: 'Order not found or access denied' }
                }

                if (orderCheck.data.status !== 'processing') {
                    return { error: 'Order shipping details can only be modified when order is processing' }
                }

                const response = await axios.put(`${wpUrl}/wp-json/wc/v3/orders/${orderId}`, {
                    shipping: {
                        [field]: value
                    }
                }, { headers });

                return { data: { id: response.data.id, shipping: response.data.shipping } }

            } catch (error) {
                return { error: 'Failed to update shipping details: ' + error.message }
            }
        }],

        [/\/?orders\s*(\d+)?/, async (match) => {
            try {
                const limit = match[1] ? parseInt(match[1]) : 1;

                const response = await axios.get(`${wpUrl}/wp-json/wc/v3/orders`, {
                    headers,
                    params: {
                        customer: '{{variables.publicUserId}}',
                        per_page: limit,
                        orderby: 'date',
                        order: 'desc'
                    }
                });

                const cleanOrders = response.data.map(({
                                                           id, status, date_created, total, currency,
                                                           payment_method, shipping_total, line_items,
                                                           shipping, billing
                                                       }) => ({
                    id, status, date_created, total, currency,
                    payment_method, shipping_total,
                    line_items: line_items.map(({ name, quantity, total, price, sku }) =>
                        ({ name, quantity, total, price, sku })),
                    shipping,
                    billing
                }));

                return { data: cleanOrders }

            } catch (error) {
                return { error: 'Failed to fetch orders: ' + error.message }
            }
        }],

        [/\/?wpSearch\("([^"]*)"(?:\s*,\s*(\d+))?(?:\s*,\s*"([^"]*)")?(?:\s*,\s*(\d+(?:\.\d+)?))?\)/, async (match) => {
            const query = match[1] || " ";
            const limit = match[2] || 10;
            const itemTypes = match[3] ? match[3].split(',').map(type => type.trim()) : undefined;
            const maxPrice = match[4];

            try {
                const params = {
                    query,
                    kbId: openkbs.kbId,
                    limit,
                    ...(itemTypes && { itemTypes }),
                    ...(maxPrice && { maxPrice })
                };

                const response = await axios.get(`${wpUrl}/wp-json/openkbs/v1/search`, {
                    headers,
                    params
                });

                return { data: response.data };
            } catch (e) {
                return { error: e.response?.data || e.message };
            }
        }],

        [/\/?webpageToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.webpageToText(match[1]);

                // limit output length
                if (response?.content?.length > 5000) {
                    response.content = response.content.substring(0, 5000);
                }

                return { data: response };
            } catch (e) {
                return { error: e.response.data };
            }
        }],

        [/\/?documentToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.documentToText(match[1]);

                // limit output length
                if (response?.text?.length > 5000) {
                    response.text = response.text.substring(0, 5000);
                }

                return { data: response };
            } catch (e) {
                return { error: e.response.data };
            }
        }],

        [/\/?imageToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.imageToText(match[1]);

                if (response?.detections?.[0]?.txt) {
                    response = { detections: response?.detections?.[0]?.txt };
                }

                return { data: response };
            } catch (e) {
                return { error: e.response.data };
            }
        }],

    ];
}
;// CONCATENATED MODULE: ./onResponse.js


const handler = async (event) => {
    const meta = {_meta_actions: ["REQUEST_CHAT_MODEL"]};
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
module.exports = __webpack_exports__;
/******/ })()
;
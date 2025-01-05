export const getActions = (meta) => {
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
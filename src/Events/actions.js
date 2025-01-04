export const getActions = (meta) => {
    return [
        [/\/?wpSearch\("([^"]*)"(?:\s*,\s*(\d+))?(?:\s*,\s*"([^"]*)")?\)/, async (match) => {
            const wpUrl = '{{secrets.wpUrl}}';
            const headers = { 'WP-API-KEY': '{{secrets.wpapiKey}}' };
            const query = match[1];
            const limit = match[2] || 10;
            const itemTypes = match[3];

            try {
                const params = {
                    query,
                    kbId: openkbs.kbId,
                    limit,
                    ...(itemTypes && { itemTypes })
                };

                const response = await axios.get(`${wpUrl}/wp-json/openkbs/v1/search`, {
                    headers,
                    params
                });

                return { data: response.data, ...meta };
            } catch (e) {
                return { error: e.response?.data || e.message, ...meta };
            }
        }],

        [/\/?webpageToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.webpageToText(match[1]);

                // limit output length
                if (response?.content?.length > 5000) {
                    response.content = response.content.substring(0, 5000);
                }

                return { data: response, ...meta };
            } catch (e) {
                return { error: e.response.data, ...meta };
            }
        }],

        [/\/?documentToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.documentToText(match[1]);

                // limit output length
                if (response?.text?.length > 5000) {
                    response.text = response.text.substring(0, 5000);
                }

                return { data: response, ...meta };
            } catch (e) {
                return { error: e.response.data, ...meta };
            }
        }],

        [/\/?imageToText\("(.*)"\)/, async (match) => {
            try {
                let response = await openkbs.imageToText(match[1]);

                if (response?.detections?.[0]?.txt) {
                    response = { detections: response?.detections?.[0]?.txt };
                }

                return { data: response, ...meta };
            } catch (e) {
                return { error: e.response.data, ...meta };
            }
        }],

        [/\/?textToSpeech\("(.*)"\s*,\s*"(.*)"\)/, async (match) => {
            try {
                const response = await openkbs.textToSpeech(match[2], {
                    languageCode: match[1]
                });
                return { data: response, ...meta };
            } catch (e) {
                return { error: e.response.data, ...meta };
            }
        }],

    ];
}
import React from "react";
import {

    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActionArea,
    Box
} from '@mui/material';
import {CallMade} from '@mui/icons-material';

const PostCard = ({ title, url, imageUrl, price }) => {
    return (
        <Card sx={{
            maxWidth: 345,
            margin: '10px 0',
            width: '100%',
            backgroundColor: '#f8f9fa'
        }}>
            <CardActionArea onClick={() => window.open(url, '_blank')}>
                {imageUrl && (
                    <CardMedia
                        component="img"
                        height="140"
                        image={imageUrl}
                        alt={title}
                        sx={{
                            objectFit: 'contain',
                            backgroundColor: '#ffffff'
                        }}
                    />
                )}
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography
                            variant="subtitle1"
                            component="div"
                            sx={{
                                fontWeight: 500,
                                flex: 1,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {title}
                        </Typography>
                        <CallMade
                            sx={{
                                ml: 1,
                                fontSize: 16,
                                color: 'text.secondary',
                                flexShrink: 0
                            }}
                        />
                    </Box>
                    {price && (
                        <Typography
                            variant="body1"
                            color="primary"
                            sx={{
                                fontWeight: "bold",
                                mt: 1
                            }}
                        >
                            {price}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default PostCard;
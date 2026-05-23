import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    Paper,
    CircularProgress,
    Fab,
    IconButton,
    Slide,
    Button,
    Alert,
} from '@mui/material';
import { Send, SmartToy, Close } from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';

export default function AIAssistant({ resume, selectedJobRole, analysisResult }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [chatError, setChatError] = useState('');
    const [lastSubmittedMessage, setLastSubmittedMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageOverride) => {
        const messageToSend = (messageOverride || input).trim();
        if (!messageToSend) return;

        const userMessage = messageToSend;
        setInput('');
        setChatError('');
        setLastSubmittedMessage(userMessage);
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await apiClient.post(
                '/chat',
                {
                    message: userMessage,
                    context: {
                        jobRole: selectedJobRole,
                        resumeSkills: resume?.skills || [],
                        missingSkills: analysisResult?.missingSkills || [],
                        roadmap: analysisResult?.roadmap || []
                    }
                }
            );

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: response.data.reply }
            ]);

        } catch (error) {
            const apiError = normalizeApiError(error, 'Sorry, I encountered an error. Please try again.');
            setChatError(apiError.userMessage);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: apiError.userMessage
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={() => setIsOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <SmartToy />
                </Fab>
            )}

            {/* Chat Window */}
            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <Card sx={{
                    position: 'fixed',
                    bottom: 90,
                    right: 24,
                    width: 350,
                    height: 500,
                    borderRadius: 2,
                    zIndex: 1000,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <Box sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToy fontSize="small" />
                            <Typography variant="subtitle1" fontWeight="bold">AI Assistant</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }} aria-label="Close AI assistant">
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
                        {chatError && (
                            <Alert
                                severity="error"
                                sx={{ mb: 1 }}
                                action={(
                                    <Button size="small" color="inherit" onClick={() => handleSendMessage(lastSubmittedMessage)} disabled={loading || !lastSubmittedMessage}>
                                        Retry
                                    </Button>
                                )}
                            >
                                {chatError}
                            </Alert>
                        )}

                        <Box sx={{
                            flex: 1,
                            overflowY: 'auto',
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                        }}>
                            {messages.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
                                    <SmartToy sx={{ fontSize: 40, color: 'primary.main', mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        Ask me about your career path or skills.
                                    </Typography>
                                </Box>
                            ) : (
                                messages.map((msg, idx) => (
                                    <Paper
                                        key={idx}
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: msg.role === 'user' ? 'primary.main' : 'divider',
                                            color: 'text.primary',
                                            borderRadius: 2,
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                            {msg.content}
                                        </Typography>
                                    </Paper>
                                ))
                            )}

                            {loading && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="caption" color="text.secondary">AI is typing...</Typography>
                                </Box>
                            )}

                            <div ref={messagesEndRef} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                disabled={loading}
                                size="small"
                                variant="outlined"
                            />
                            <IconButton
                                color="primary"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || loading}
                                size="small"
                                aria-label="Send message"
                            >
                                <Send fontSize="small" />
                            </IconButton>
                        </Box>
                    </CardContent>
                </Card>
            </Slide>
        </>
    );
}


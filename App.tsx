import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContentType, AIResponse, Message } from './types';
import { INITIAL_AI_RESPONSE, INITIAL_AI_MESSAGE } from './constants';
import { startChatSession, sendMessageToAI, generateSpeech } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import SuggestionChip from './components/SuggestionChip';
import MessageBubble from './components/MessageBubble';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import { decode, decodeAudioData } from './utils/audio';
import { Chat } from '@google/genai';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const Header: React.FC = () => (
    <header className="flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-300/10 dark:border-gray-700/50">
        <div className="flex items-center space-x-2">
            <span className="material-icons-outlined text-primary text-2xl">account_balance</span>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Foresters Financials Agent</h1>
        </div>
        <div className="flex items-center space-x-4">
            <button className="text-gray-600 dark:text-gray-400"><span className="material-icons-outlined">settings</span></button>
            <button className="text-gray-600 dark:text-gray-400"><span className="material-icons-outlined">more_vert</span></button>
        </div>
    </header>
);

interface FooterProps {
    onSendMessage: (message: string) => void;
    onToggleListening: () => void;
    isListening: boolean;
    isLoading: boolean;
    transcript: string;
}

const Footer: React.FC<FooterProps> = ({ onSendMessage, onToggleListening, isListening, isLoading, transcript }) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setInputValue(transcript);
    }, [transcript]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <footer className="p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm sticky bottom-0 border-t border-gray-300/10 dark:border-gray-700/50">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading || isListening}
                            className="w-full pl-4 pr-10 py-3 bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder={isListening ? 'Listening...' : "Type a message or tap the mic..."}
                            type="text" />
                        <button onClick={handleSend} disabled={isLoading || isListening || !inputValue} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-icons-outlined">send</span>
                        </button>
                    </div>
                    <button
                        onClick={onToggleListening}
                        disabled={isLoading}
                        aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center text-white rounded-full shadow-lg shadow-primary/40 transition-all duration-300 active:scale-95 ${isListening ? 'bg-red-600 hover:bg-red-500 animate-listening' : 'bg-primary hover:bg-violet-500'} ${isLoading ? 'bg-slate-500 cursor-not-allowed' : ''}`}>
                        <span className="material-icons-outlined text-2xl">mic</span>
                    </button>
                </div>
            </div>
        </footer>
    );
};

const App: React.FC = () => {
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [currentContent, setCurrentContent] = useState<{ type: ContentType, data: any }>({ type: 'none', data: {} });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<{ interim: string, final: string }>({ interim: '', final: ''});
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, currentContent]);


    const playAudio = useCallback(async (base64Audio: string) => {
        if (!base64Audio || !audioContextRef.current || !gainNodeRef.current) return;
        try {
            setIsSpeaking(true);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNodeRef.current);
            source.start();
            source.onended = () => setIsSpeaking(false);
        } catch (error) {
            console.error("Failed to play audio", error);
            setIsSpeaking(false);
        }
    }, []);

    const handleAIResponse = useCallback(async (response: AIResponse) => {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: response.responseText, sender: 'ai' }]);
        setSuggestions(response.suggestions);
        setCurrentContent({ type: response.contentType, data: response.contentData });
        setIsLoading(false);
        
        const audio = await generateSpeech(response.responseText);
        playAudio(audio);
    }, [playAudio]);

    const processMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chatSession) return;
        setIsLoading(true);
        setSuggestions([]);
        setCurrentContent({ type: 'none', data: {} });
        setMessages(prev => [...prev, { id: `user-${Date.now()}`, text: messageText, sender: 'user' }]);
        
        const aiResponse = await sendMessageToAI(chatSession, messageText);
        handleAIResponse(aiResponse);
    }, [isLoading, chatSession, handleAIResponse]);

    useEffect(() => {
      if (!isListening && transcript.final.trim()) {
        processMessage(transcript.final);
        setTranscript({ interim: '', final: '' });
      }
    }, [isListening, transcript.final, processMessage]);

    const setupSpeechRecognition = useCallback(() => {
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setTranscript({ interim, final: transcript.final + final });
        };
        recognitionRef.current = recognition;
    }, [transcript.final]);

    useEffect(() => {
        const initialize = async () => {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                gainNodeRef.current = audioContextRef.current.createGain();
                gainNodeRef.current.connect(audioContextRef.current.destination);
                
                const session = startChatSession();
                if (!session) throw new Error("Failed to start chat session.");
                setChatSession(session);
                setupSpeechRecognition();
                
                // Set initial state
                setMessages([INITIAL_AI_MESSAGE]);
                setSuggestions(INITIAL_AI_RESPONSE.suggestions);
                setCurrentContent({ type: INITIAL_AI_RESPONSE.contentType, data: INITIAL_AI_RESPONSE.contentData });

                setIsLoading(false);

            } catch (error) {
                console.error(error);
                setMessages([{
                    id: 'error-msg',
                    sender: 'ai',
                    text: 'There was a problem connecting to the AI service. Please check your configuration and refresh the page.'
                }])
                setCurrentContent({
                    type: 'support',
                    data: { title: 'Initialization Failed', message: 'Could not connect to the AI service. Please check your API key and refresh the page.' }
                });
                setIsLoading(false);
            }
        };
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setupSpeechRecognition]);

    const handleToggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript({ interim: '', final: ''});
            recognitionRef.current?.start();
        }
    };
    
    const AIIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display antialiased text-gray-800 dark:text-gray-100">
            <Header />
            <main className="flex-1 flex flex-col overflow-hidden background-gradient">
                <div className="flex justify-center pt-6 pb-4">
                    <Avatar isLoading={isLoading} isSpeaking={isSpeaking} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        {isLoading && (
                             <div className={`flex items-start gap-3 my-4 justify-start`}>
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                    <AIIcon />
                                </div>
                                <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                                    <LoadingSpinner />
                                </div>
                            </div>
                        )}
                        
                        <ContentDisplay 
                            contentType={currentContent.type} 
                            contentData={currentContent.data}
                            onInsuranceProductClick={(productName) => processMessage(`Tell me more about ${productName}`)}
                        />

                        {suggestions.length > 0 && !isLoading && (
                            <div className="flex flex-wrap gap-2 justify-center py-4">
                                {suggestions.map((text, i) => (
                                    <SuggestionChip key={i} text={text} onClick={processMessage} disabled={isLoading} />
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </main>
            <Footer 
                onSendMessage={processMessage}
                onToggleListening={handleToggleListening}
                isListening={isListening}
                isLoading={isLoading}
                transcript={transcript.final.trim() || transcript.interim}
            />
        </div>
    );
};

export default App;
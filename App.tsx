import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Suggestion, ContentType, AIResponse } from './types';
import { INITIAL_AI_MESSAGE, INITIAL_AI_RESPONSE } from './constants';
import { startChatSession, sendMessageToAI, generateSpeech } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import SuggestionChip from './components/SuggestionChip';
import ContentDisplay from './components/ContentDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import MicrophoneButton from './components/MicrophoneButton';
import { decode, decodeAudioData } from './utils/audio';
import { Chat } from '@google/genai';

// Polyfill for SpeechRecognition
// FIX: Cast window to any to access non-standard SpeechRecognition property
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [currentContent, setCurrentContent] = useState<{ type: ContentType, data: any }>({ type: 'none', data: {} });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isSessionStarted, setIsSessionStarted] = useState<boolean>(false);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<{ interim: string, final: string }>({ interim: '', final: ''});
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    // FIX: Use InstanceType to get the instance type from the SpeechRecognition constructor
    // variable. This avoids a name collision with the variable also named 'SpeechRecognition'.
    const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

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

    const speakAndDisplay = useCallback(async (response: AIResponse) => {
        const audio = await generateSpeech(response.responseText);
        playAudio(audio);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: response.responseText, sender: 'ai' }]);
        setSuggestions(response.suggestions);
        setCurrentContent({ type: response.contentType, data: response.contentData });
        setIsLoading(false);
    }, [playAudio]);

    const processMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chatSession) return;

        setIsLoading(true);
        setSuggestions([]);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: messageText, sender: 'user' }]);

        const aiResponse = await sendMessageToAI(chatSession, messageText);
        speakAndDisplay(aiResponse);

    }, [isLoading, chatSession, speakAndDisplay]);

    useEffect(() => {
      if (!isListening && transcript.final.trim()) {
        processMessage(transcript.final);
        setTranscript({ interim: '', final: '' });
      }
    }, [isListening, transcript.final, processMessage]);

    const setupSpeechRecognition = useCallback(() => {
        if (!SpeechRecognition) {
            console.error("Speech Recognition is not supported in this browser.");
            // Optionally, show a message to the user
            return;
        }
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

    const handleStartSession = useCallback(() => {
        setIsSessionStarted(true);
        setIsLoading(true);
        
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);

            const session = startChatSession();
            if (!session) throw new Error("Failed to start chat session.");
            setChatSession(session);
            setupSpeechRecognition();
            speakAndDisplay(INITIAL_AI_RESPONSE);

        } catch (error) {
            console.error(error);
            setCurrentContent({
                type: 'support',
                data: { title: 'Initialization Failed', message: 'Could not connect to the AI service. Please check your API key and refresh the page.' }
            });
            setIsLoading(false);
        }
    }, [speakAndDisplay, setupSpeechRecognition]);

    const handleToggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript({ interim: '', final: ''}); // Reset transcript before starting
            recognitionRef.current?.start();
        }
    };
    
    if (!isSessionStarted) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col justify-center items-center text-center p-4">
                 <Avatar isLoading={false} isSpeaking={false} />
                 <h1 className="text-3xl font-bold text-white mt-6">Welcome to Aura Shield</h1>
                 <p className="text-slate-400 mt-2 max-w-md">Your personal AI insurance advisor. Click below to start a conversation and find the perfect plan for you.</p>
                 <button onClick={handleStartSession} className="mt-8 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105">
                    Start Session
                 </button>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex flex-col w-full lg:w-2/5 xl:w-1/3 h-1/2 lg:h-full border-r border-slate-800">
                <div className="p-4 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white">Aura Shield Advisor</h1>
                    <p className="text-sm text-slate-400">Pre-emptive Conversational UI</p>
                </div>
                
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                    {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                    {isLoading && (
                        <div className="flex justify-start items-center gap-3 my-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-none">
                                <LoadingSpinner />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-800 space-y-3">
                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            {suggestions.map((s, i) => <SuggestionChip key={i} text={s} onClick={() => processMessage(s)} disabled={isLoading || isListening} />)}
                        </div>
                    )}
                    <div className="flex items-center gap-3 h-10">
                         <p className="flex-1 text-slate-400 italic px-2">
                           {transcript.interim || transcript.final || (isListening ? 'Listening...' : 'Click the mic to speak')}
                         </p>
                        <MicrophoneButton 
                            isListening={isListening} 
                            onClick={handleToggleListening} 
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full lg:w-3/5 xl:w-2/3 h-1/2 lg:h-full p-6 lg:p-10 overflow-y-auto flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl">
                     <div className="mb-8 text-center">
                        <Avatar isLoading={isLoading} isSpeaking={isSpeaking} />
                    </div>
                    <ContentDisplay 
                        contentType={currentContent.type} 
                        contentData={currentContent.data}
                        onInsuranceProductClick={(productName) => processMessage(`Tell me more about ${productName}`)}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;
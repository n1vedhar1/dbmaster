"use client"

import {useChat} from "ai/react"
import { Message } from "ai"

import Bubble from "./components/Bubble"

const Home = () => {
    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();
    const noMessages = !messages || messages.length === 0;

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">DBMASTER</h1>
                <section className="bg-white rounded-lg shadow-lg p-6">
                    <div className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto ">
                        {noMessages ? (
                            <div className="flex items-center justify-center h-[400px]">
                                <p className="text-gray-500 text-lg">Start a conversation about databases</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <Bubble key={`message${index}`} message={message} />
                                ))}
                                {isLoading && (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-pulse text-gray-500">Thinking...</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            onChange={handleInputChange} 
                            value={input} 
                            placeholder="Ask me DB things" 
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button 
                            type="submit" 
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            Send
                        </button>
                    </form>
                </section>
            </div>
        </main>
    )
}

export default Home;
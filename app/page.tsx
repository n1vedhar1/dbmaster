"use client"


import {useChat} from "ai/react"
import { Message } from "ai"
import { FaPaperPlane } from 'react-icons/fa';


import Bubble from "./components/Bubble"


const Home = () => {
   const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();
   const noMessages = !messages || messages.length === 0;


   return (
       <main className="min-h-screen bg-gray-100 flex items-center justify-center">
           <div className="h-[90vh] w-2/3 max-w-4xl flex flex-col bg-white rounded-lg shadow-lg">
               <header className="bg-slate-800 p-4 rounded-t-lg flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow">
                           <span className="text-2xl">🤖</span>
                       </div>
                       <div>
                           <h1 className="text-xl font-bold text-white">LEGO DBmaster</h1>
                           <span className="text-green-200 text-xs flex items-center gap-1">
                               <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                               Online
                           </span>
                       </div>
                   </div>
                   <button className="text-white opacity-70 hover:opacity-100 text-xl">
                       ×
                   </button>
               </header>
              
               <section className="flex-1 overflow-hidden flex flex-col">
                   <div className="flex-1 overflow-y-auto p-4 space-y-4">
                       {noMessages ? (
                           <div className="flex items-center justify-center h-full">
                               <p className="text-gray-500 text-lg">Start a conversation about databases</p>
                           </div>
                       ) : (
                           <>
                               {messages.map((message, index) => (
                                   <Bubble key={`message${index}`} message={message} />
                               ))}
                               {isLoading && (
                                   <div className="flex items-center justify-center">
                                       <div className="animate-pulse text-blue-700">Thinking...</div>
                                   </div>
                               )}
                           </>
                       )}
                   </div>
                   <div className="border-t border-gray-200 p-4 bg-white">
                       <form onSubmit={handleSubmit} className="flex gap-2">
                           <input
                               onChange={handleInputChange}
                               value={input}
                               placeholder="Ask me LEGO things..."
                               className="flex-1 p-3 border-2 border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-gray-800 bg-white shadow-sm placeholder-gray-400"
                           />
                           <button
                               type="submit"
                               className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                               disabled={isLoading}
                           >
                               <span className="hidden sm:inline">Send</span>
                               <FaPaperPlane className="text-lg" />
                           </button>
                       </form>
                   </div>
               </section>
           </div>
       </main>
   )
}


export default Home;

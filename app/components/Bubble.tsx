import { FaCheckDouble } from 'react-icons/fa';


const Bubble = ({ message }) => {
   const { content, role, createdAt } = message;
   const isUser = role === 'user';
   return (
       <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
           {!isUser && (
               <div className="mr-2">
                   <img
                       src="https://api.dicebear.com/7.x/bottts/svg?seed=bot"
                       alt="Bot Avatar"
                       className="w-8 h-8 rounded-full border border-gray-200 shadow"
                   />
               </div>
           )}
           <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative ${
               isUser
                   ? 'bg-gray-100 text-gray-900 rounded-br-none'
                   : 'bg-slate-400 text-white rounded-bl-none'
           }`}>
               <p className="whitespace-pre-wrap text-base">{content}</p>
               <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                   <span>{createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                   {isUser && <FaCheckDouble className="text-blue-500 ml-1" title="Read" />}
               </div>
           </div>
           {isUser && (
               <div className="ml-2">
                   <img
                       src="https://api.dicebear.com/7.x/adventurer/svg?seed=user"
                       alt="User Avatar"
                       className="w-8 h-8 rounded-full border border-gray-200 shadow"
                   />
               </div>
           )}
       </div>
   );
}


export default Bubble;

const PromptSuggestionButton = ({ text, onClick }: { text: string, onClick: () => void }) => {
    return (
        <button 
            onClick={onClick}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {text}
        </button>
    )
}

export default PromptSuggestionButton;

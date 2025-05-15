import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestions = ({onPromptClick}: {onPromptClick: (prompt: string) => void}) => {
    const prompts = [
        "How many Purchase Orders are there?",
        "How many armadas are coming today?",
        "How many Purchase Orders are in receiving now?",
    ]
    return (
        <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested Questions</h3>
            <div className="flex flex-wrap gap-2">
                {prompts.map((prompt, index) => (
                    <PromptSuggestionButton 
                        key={index} 
                        text={prompt} 
                        onClick={() => {
                            onPromptClick(prompt);
                        }} 
                    />
                ))}
            </div>
        </div>
    )
}

export default PromptSuggestions;

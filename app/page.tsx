"use client"

import {useChat} from "ai/react"
import { Message } from "ai"

import Bubble from "./components/Bubble"

const Home = () => {
    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();
    const noMessages = !messages || messages.length === 0;

    return (
        <main>
            <div>DBMASTER</div>
            <section>
                {noMessages ? (
                    <>
                    <p>No messages</p>
                    </>
                ) : (
                    <>
                    {messages.map((message, index) => (
                        <Bubble key={`message${index}`} message={message} />
                    ))}
                    {isLoading && <p>Loading...</p>}
                    </>
                )}
                <form onSubmit={handleSubmit}>
                    <input onChange={handleInputChange} value={input} placeholder="Ask me DB things"/>
                    <input type="submit"/>
                </form>
            </section>
        </main>
    )

}

export default Home;
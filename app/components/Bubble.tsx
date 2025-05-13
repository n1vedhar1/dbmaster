const Bubble = ({message}) => {
    const { content, role } = message;
    return (
        <>
            <p>{content}</p>
        </>
    )
}

export default Bubble;
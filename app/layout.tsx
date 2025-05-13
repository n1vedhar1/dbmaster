import "./global.css";

export const metadata = {
  title: "DbMaster",
  description: "Dbmaster",
};

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

export default RootLayout;

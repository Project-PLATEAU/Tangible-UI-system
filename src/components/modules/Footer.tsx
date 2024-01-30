import React from "react";
import { Link } from "react-router-dom"

const Footer: React.FunctionComponent = () => {
    return (
        <footer className="footer">
            <p>This is abc Page</p>
            <Link to="/"><p>To Top Page</p></Link>
        </footer>
    )
}

export default Footer
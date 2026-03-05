import React from 'react'
import {Box} from "lucide-react";
import Button from "./ui/Button";

const Navbar = () => {


    const isSignedIn = false
    const username = "James"
    const handleAuthClick = async () => {};

    return (
        <div>
            <header className="navbar">
                <nav className="inner">
                    <div className="left">
                        <div className="brand">
                            <Box className="logo" />
                            <span className="name">Roomie</span>
                        </div>

                            <ul className={"links"}>
                                <a href="#">Product</a>
                                <a href="#">Pricing</a>
                                <a href="#">Community</a>
                                <a href="#">Enterprise</a>
                            </ul>
                    </div>

                    <div className={"actions"}>
                        {isSignedIn ? (
                                <>
                                    <span className={"greeting"}>
                                        {username? `Hi, ${username}` : "Signed In"}
                                    </span>
                                    <Button size="sm" onClick={handleAuthClick}>
                                        Log Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={handleAuthClick} size="sm" variant={"ghost"}>
                                        Log In
                                    </Button>
                                    <a href="#upload" className={"cta"}> Get Started </a>
                                </>
                        )}
                    </div>
                </nav>
            </header>
        </div>
    )
}

export default Navbar
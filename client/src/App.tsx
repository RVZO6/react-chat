import { io } from "socket.io-client"
import clsx from "clsx"
import React, { useState, useEffect, useRef } from "react"
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

const socket = io(import.meta.env.VITE_SOCKET_URL);
export default function App() {
  interface ChatEntry {
    username: string;
    message: string;
  }
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [username, setUsername] = useState('')
  const [textInput, setTextInput] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  //sync messages with server
  useEffect(() => {
    // --- Handlers ---
    const handleNewMessage = (message: ChatEntry) => {
      setChatMessages(prevMessages => [...prevMessages, message]);
    };

    const handleUserTyping = (typingUsername: string) => {
      setTypingUsers((prevUsers) =>
        prevUsers.includes(typingUsername)
          ? prevUsers
          : [...prevUsers, typingUsername]
      );
    };

    const handleUserStopTyping = (typingUsername: string) => {
      setTypingUsers((prevUsers) =>
        prevUsers.filter(otherUser => otherUser !== typingUsername)
      );
    };

    // --- Listeners ---
    socket.on('chat message', handleNewMessage);

    // Correctly receive the object and pass the username to the handler
    socket.on('user typing', ({ username }: { username: string }) => {
      handleUserTyping(username);
    });

    // Correctly receive the object and pass the username to the handler
    socket.on('user stopped typing', ({ username }: { username: string }) => {
      handleUserStopTyping(username);
    });


    // --- Cleanup ---
    return () => {
      socket.off('chat message', handleNewMessage);
      socket.off('user typing');
      socket.off('user stopped typing');
    };
  }, []); // Empty dependency array is correct.
  //autoscroll
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [chatMessages])
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [chatMessages]);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (textInput.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('stop typing');
      socket.emit('chat message', { username: username, message: textInput });
      setTextInput('');
    }


  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing');
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop typing');
    }, 2000);
    setTextInput(e.target.value);
  }

  function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUsername(usernameInput)
    socket.emit('register', usernameInput)
    setUsernameInput('')
  }
  let typingDisplay = null;
  if (typingUsers.length === 1) {
    typingDisplay = `${typingUsers[0]} is typing...`;
  } else if (typingUsers.length === 2) {
    typingDisplay = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  } else if (typingUsers.length > 2) {
    typingDisplay = 'Several people are typing...';
  }
  if (!username) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-[450px]">
          <CardHeader />
          <CardContent className="h-[500px] flex items-center justify-center">
            <form onSubmit={handleUsernameSubmit} className="flex w-full max-w-sm space-x-2">
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username..."
                autoFocus // A nice touch to focus the input on page load
              />
              <Button type="submit">Join</Button>
            </form>
          </CardContent>
          <CardFooter />
        </Card>
      </div>
    )
  } else {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Real-Time Chat</CardTitle>
          </CardHeader>
          <CardContent
            ref={scrollContainerRef}
            className="h-[500px] flex flex-col overflow-y-auto p-4 space-y-2 scroll-smooth no-scrollbar">
            {
              chatMessages.map((message, index) => {
                const isMyMessage = message.username === username
                return (
                  <motion.div
                    key={index}
                    // 2. Define the starting state of the animation
                    initial={{
                      opacity: 0,   // Start invisible
                      scale: 0.8,   // Start slightly smaller
                      y: 20,        // Start 20px lower
                    }}
                    // 3. Define the final state of the animation
                    animate={{
                      opacity: 1,   // End fully visible
                      scale: 1,     // End at normal size
                      y: 0,         // End at its normal Y position
                    }}
                    // 4. Define the physics of the transition
                    transition={{
                      type: "spring", // Use a spring physics for a bouncy, natural feel
                      stiffness: 260, // How "stiff" the spring is
                      damping: 20,    // How much friction is applied
                      duration: 0.3,  // A quick duration
                    }}
                    // The conditional styling logic remains the same
                    className={clsx(
                      'p-2 rounded-lg max-w-xs min-w-32 break-words',
                      {
                        'self-end bg-blue-500 text-white': isMyMessage,
                        'self-start bg-gray-200 dark:bg-gray-700': !isMyMessage,
                      }
                    )}
                  >
                    <strong className="block">{message.username}</strong>
                    {message.message}
                  </motion.div>
                );
              })}



            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="h-6 text-sm text-gray-500 dark:text-gray-400">
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="bounce-dot"></div>
                    <div className="bounce-dot"></div>
                    <div className="bounce-dot"></div>
                  </div>
                  <span>{typingDisplay}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex w-full space-x-2 pt-2">
              <Input
                value={textInput}
                onChange={handleChange}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    )
  }
}

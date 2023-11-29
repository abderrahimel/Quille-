import { Send } from "lucide-react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { useContext, useRef } from "react"
import { ChatContext } from "./ChatContext"

interface ChatInputProps {
  isDisabled?: boolean
}

const  ChatInput = ({ isDisabled }: ChatInputProps) => {
    // every component that use context to comunicate with other component need to be as children of context provider
  const { addMessage,
          handleInputChange,
          isLoading,
          message } = useContext(ChatContext);
  const textareaRef = useRef<HTMLTextAreaElement>(null)
      
  return (
    <div className="absolute bottom-0 left-0 w-full">
        <div className="mx-2 flex flex-row gap-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
          <div className="relative flex h-full flex-1 item-stretch md:flex-col">
            <div className="relative flex flex-col w-full flex-grow p-4">
              <div className="relative">
                {/* customized  with 'react-textarea-autosize' */}
                <Textarea 
                     rows={1} 
                     ref={textareaRef}
                     maxRows={4} 
                     autoFocus 
                     onChange={handleInputChange}
                     value={message}
                    //  when the user klick enter
                     onKeyDown={(e)=>{
                      if(e.key==='ENTER' && !e.shiftKey){
                        e.preventDefault();
                        addMessage();
                        textareaRef.current?.focus()
                      }
                     }}
                     placeholder="Enter your question ..." className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch" />
                <Button 
                    disabled={isLoading || isDisabled}
                    className="absolute bottom-1.5 righ-[8px]" 
                    aria-label="send message"
                    onClick={()=>{
                      addMessage();
                      textareaRef.current?.focus()
                    }}
                    ><Send className="h-4 w-4"/></Button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default ChatInput
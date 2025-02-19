import { Conversation, ROLES } from '@/pages/chat';
import React, { useRef, useState } from 'react'


interface Props {
  conversations: Conversation[];
  updateConversations: (conversations: Conversation[]) => void;
  updateErrMsg: (msg: string) => void;
  updateSavingStatus: (msg: boolean) => void;
}


const Input = (props: Props) => {

  const {
    conversations,
    updateConversations,
    updateErrMsg,
    updateSavingStatus,
  } = props;
  const [isMoblie, setIsMoblie] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const stop = useRef(false);

  let payload: Conversation[] = [];
  let storeMsg = "";

  // 提交消息
  async function handleSubmit() {
    stop.current = false;
    if (!message.trim()) {
      return;
    }
    updateErrMsg("");
    const currentQuestion = {
      role: ROLES.USER,
      content: message.trim(),
    };

    payload = [...conversations, currentQuestion]
    updateConversations(payload);
    fetchData(payload);
    setMessage("");
  }

  // 清除对话
  function handleClear() {
    updateConversations([
      {
        role: ROLES.SYSTEM,
        content: "You are a helpful assistant. Answer in detail.",
      },
    ])
  }

  // 停止页面返回消息
  function handleStop() {
    stop.current = true;
    setSubmitLoading(false);
  }

  // 获取数据
  function fetchData(payload: Conversation[]) {
    setSubmitLoading(false);

    const body = {
      messages: payload
    };
    console.log("body: ", body);
    fetch(`${location.origin}/api/chat`, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network error: " + response);
        }
        if (!response.body) {
          throw new Error("There was an error fetching");
        }

        const decoder = new TextDecoder("utf-8");
        const reader = response?.body?.getReader();
        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (stop.current) return;

              if (done) {
                setSubmitLoading(false);
                return;
              }
              const content = decoder.decode(value);

              if (content) {
                storeMsg += content;
                const curQuestion: Conversation = {
                  role: ROLES.ASSISTANT,
                  content: storeMsg.toString(),
                };
                updateConversations([...payload, curQuestion]);
              }
              read();
            })
            .catch((err) => {
              updateErrMsg(err.toString());
              setSubmitLoading(false);
            });
        }

        read();

      })
      .catch((err) => {
        updateErrMsg(err.toString());
        setSubmitLoading(false);
      });
  }

  function handleKeyDown(event: any){
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)){
      event.preventDefault();

      if (!submitLoading) {
        handleSubmit();
      }
    }
  }


  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    // 在这里处理发送消息的逻辑
    console.log('发送消息:', message);
    setMessage(''); // 清空消息输入框
  };

  return (
    <>
      <div className="my-10  w-full max-w-6xl text-center flex items-center bg-lime-500 px-4  dark:bg-gray-800   ">
        <textarea
          // type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-2 m-2"
          placeholder={
            submitLoading
            ? "Waiting..."
            : `Ask me anything. (cmd + enter to submit)`
          }
          onKeyDown={handleKeyDown}
        />
        {/* <div className="flex-grow"></div> 占据剩余空间 */}
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="mt-3 h-10 w-40 rounded bg-black font-medium text-white hover:bg-slate-700 dark:bg-slate-300 dark:text-black dark:hover:bg-slate-400"
        >
          发送
        </button>
      </div>
    </>
  )
}

export default Input


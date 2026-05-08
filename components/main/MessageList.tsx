const messages = [
    {
      id: 1,
      type: "friend",
      content: "지금 어디야?",
    },
    {
      id: 2,
      type: "me",
      content: "지금 학교에 있어",
    },
    {
      id: 3,
      type: "friend",
      content: "난 강남역 근처야",
    },
    {
      id: 4,
      type: "me",
      content: "그럼 우리 중간쯤에서 만나자",
    },
    {
      id: 5,
      type: "friend",
      content: "좋아 지도에서 중간 지점 확인해보자",
    },
  ];
  
  export default function MessageList() {
    return (
      <div className="flex-1 flex flex-col gap-4 px-6 py-4">
        <p className="text-center text-gray-400 text-sm">---오늘---</p>
  
        {messages.map((message) => {
          if (message.type === "me") {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white rounded-2xl px-4 py-2 text-sm">
                  {message.content}
                </div>
              </div>
            );
          }
  
          return (
            <div key={message.id} className="flex items-end gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">
                {message.content}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
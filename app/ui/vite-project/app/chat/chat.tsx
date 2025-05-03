import { Suspense, useState, memo, useEffect } from "react"
type TAppendResponse = {
   result: {[key: string]: any}
}

function getLocation() {
   const [latitude, setLatitude] = useState(null);
   const [longitude, setLongitude] = useState(null);

   useEffect(() => {
      function handleSuccess(position: any) {
         setLatitude(position.coords.latitude);
         setLongitude(position.coords.longitude);
      };
   
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(handleSuccess, (error) => {console.log(error)});
      } else {
         console.error('Geolocation is not supported by this browser.');
      }
   }, [])

   return {
      latitude,
      longitude
   }
 }

async function fetchResponse(content: string, cb: any) {
   cb('')
   const res = await fetch("/api/execute", {
      method: "POST",
      body: content,
      headers: {
         "Content-Type": "application/json"
      }
   })

   const result = await res.json();

   if (!res.ok) {
      // alert(`Something went wrong: ${res.statusText} (${res.status})`);
      console.error(result.message);
      return null;
   }

   return result;
}

const AppendResponse = memo(function AppendResponse(props: {result: {[key: string]: any}}) {
   const success = props.result.success;
   const serverErrorMessage = props.result.serverErrorMessage;
   const llmWarnMessage = props.result.llmWarnMessage;
   const data: any[] = props.result.data;

   function Inserted ({ text }: { text: string}) {
      const formattedText = text.replace(/\n/g, '<br>');
      return (
        <div
        className="mb-2"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    };

   return (
         <div data-text="chat-1" className="flex w-[75%]" >
            <div
               className={`
                  p-2 rounded-2xl
                  ${serverErrorMessage && "bg-red-300 border border-gray-300"}
                  ${llmWarnMessage && "bg-orange-200 border border-gray-300"}
               `}
            >
               {
                  !success && 
                  <div>
                     { serverErrorMessage && <p>{serverErrorMessage}</p> }
                     { llmWarnMessage && <p>{llmWarnMessage}</p> }
                  </div>
               }
               {data.map((entry, index) => (
                  <div key={ "result_" + window.performance.now() * 1e6}>
                     {entry.type === "LLM_ADDITIONAL_FIRST_MESSAGE" && <Inserted text={entry.message}/>}
                     {entry.type === "RESTAURANT_RESULTS" && 
                     (
                        entry.results?.map((entry2: any, index: number) => (
                           <div key={"list_" + window.performance.now() * 1e6}>
                              <div className="font-medium text-lg">
                                 <span>{index+1}</span>. <span>{entry2.name}</span>
                              </div>
                              
                              <div>
                                 <ul>
                                    { entry2.location.formatted_address ? <li> Address: {entry2.location.formatted_address} </li> : <li> Address: {entry2.location.locality} ({entry2.location.country}) </li> }
                                    { entry2.cuisine && <li>Cuisine: {entry2.cuisine} </li> }
                                    { entry2.rating && <li>Rating: {entry2.rating} </li>}
                                    { entry2.price && <li>Price: {entry2.price} </li>}
                                    { entry2.open_at && <li>Opening Hours: {entry2.open_at} </li>}
                                 </ul>
                              </div>
                             
                           </div>
                        ))
                     )}
                  </div>
               ))}
            </div>
         </div>
   )
})

const Question = memo(function Question(props: {question: string}) {
   return <div data-text="chat-1" className="flex justify-end" >
            <p className="border border-gray-300 p-2 rounded-2xl bg-stone-200 w-fit">
               {props.question}
            </p>
          </div>
})

export default function Chat() {
   const [chatHistory, setChatHistory] = useState<
      {question?: string; response?: {[key: string]: any} }[]
   >([]);

   const [myChat, setMyChat] = useState("");
   const [loading, setLoading] = useState(false);
   const {latitude, longitude} = getLocation();

   async function submit() {
      if (!myChat) return;

      setChatHistory(prev => [...prev, {question: myChat}]);

      setLoading(true);
      const result = await fetchResponse(JSON.stringify({message: myChat, location: [latitude,longitude]}), setMyChat);
      setLoading(false);

      if (result) {
         setChatHistory(prev => [...prev, {response: result}]);
      }
   }

   return (
      <main className="max-w-[1280px] m-auto h-screen flex flex-col justify-between border py-4">
         <section className="overflow-y-auto">
            <div className="py-4 px-8">
               { 
                  chatHistory.map((entry, index) => (
                     <div key={index} className="p-2">
                        { entry.question && <Question question={entry.question} /> }
                        { entry.response && <AppendResponse result={entry.response}/> }
                     </div>
                  ))
               }
               { loading && 
               <div role="status">
                  <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                     <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                  <span className="sr-only">Loading...</span>
               </div>
               }
            </div>
         </section>
      

         <div className="p-4">
            { !chatHistory.length && <h2 className="text-center font-semibold text-4xl py-4">What can I help you with?</h2> }
            <div className="border rounded-xl p-4 flex justify-between gap-2">
               <input type="text" value={myChat} onChange={(e)=> setMyChat(e.target.value)} className="w-full outline-0"  placeholder="Ask anything about restaurant you want to find"/>
               <button onClick={submit} className="border px-4 py-1 rounded bg-gray-300 hover:bg-gray-400">Submit</button>
            </div>
         </div>
      </main>
   )
}
# Restuarant Finder Chat

## Purpose 
( ﾟヮﾟ) This repo serve as my code challenge on integrating LLM in a web app.
(＠_＠;) This serve as restuarant finder chat assistant
(￣▽￣*)ゞ This serve as punishment for not learning earlier on LLM and proper prompts.

## (⌐■_■) Tech Stack Used and Libraries
| Type   |  Tech Stack Used and Libraries  |
| ----------- | ----------- |
| Backend     | Fastify, Typescript |
| Frontend    | React, React Router 7, Tailwind |
| LLM         | LangChain, Ollama, llama3.2 |
| Others      | git, bash, vscode, postman |

## Usage  (°ロ°)☝
Must use bash terminal
```bash
./ci.sh --all
./start.sh svc
```
## Prerequisites (ಠ_ಠ)
You must install Ollama on your machine. [Ollama link](https://ollama.com)
If you have LLM provider maybe because i am poor.

AT restaurant-finder.service.ts file, change or add the following
```js
class RestaurantFinderService implements IRestaurantFinderService {
  private modelOllama: Ollama; 
  private modelChatOpenAi: ChatOpenAI; // add you llm provider here

   // at findRestaurant add ChatOpenAI for
   async chatToLLM(model: Ollama | ChatOpenAI) {}

   // at findRestaurant
   async findRestaurant(...) {
      // Use your model here like modelChatOpenAi
      this.chatToLLM(this.modelChatOpenAi, message, ...)
   }
}
```

## Task List (￣ー￣)
- [x] Reply gracefully
- [x] Warn message if not releated to restaurant
- [x] Proper error handling
- [ ] Improve ui
- [ ] Use OpenAI api
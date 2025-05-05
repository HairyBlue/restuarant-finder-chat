import type { IRestaurantFinderService, TFindRestaurantResponse } from './types';
import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Ollama } from '@langchain/ollama';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { PromptTemplate, TypedPromptInputValues } from '@langchain/core/prompts';
import { restaurantFinderPromptTemplate, restaurantResultPromptTemplate } from '@/prompts-template';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs';
import { Document } from '@langchain/core/documents';

type ModelOptions = {
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens?: number;
  num_predict?: number;
};

type ModelOptionsGenrics<T extends { [key: string]: unknown }> = { [K in keyof (ModelOptions & T)]: (ModelOptions & T)[K] };

type llmOption = ModelOptionsGenrics<ModelOptions & { baseUrl?: string }>;

class RestaurantFinderService implements IRestaurantFinderService {
  private modelOllama: Ollama; // I wuv you, run locally save a being with no money no credit card

  constructor() {
    this.modelOllama = this.useModel(Ollama, { model: 'llama3.2', temperature: 0 });
  }

  private useModel(llm: any, option: llmOption) {
    return new llm(option);
  }

  async chatToLLM(
    model: Ollama | ChatOpenAI,
    message: string,
    promptTemplateMessage: string,
    prompTemplateOption: { [key: string]: string },
    spit: boolean = false,
    splitOption: { [key: string]: number } = {}
  ): Promise<string> {
    // Hallucinates the LLM, maybe idont know. doesnt give expected result.
    // const messages = [
    //   new SystemMessage(promptTemplateMessage),
    //   new HumanMessage(message),
    // ];

    try {
      const promptTemplate = PromptTemplate.fromTemplate(promptTemplateMessage);
      const formatedTempalte = await promptTemplate.format(prompTemplateOption);
      let response = '';

      if (spit) {
        const splitter = new RecursiveCharacterTextSplitter(splitOption);
        const output = await splitter.splitDocuments([new Document({ pageContent: formatedTempalte })]);
        for (const doc of output) {
          const llmResponse = await model.invoke(doc.pageContent);

          response += llmResponse + '\n';
        }
      } else {
        response = (await model.invoke(formatedTempalte)) as any;
      }

      return response;
    } catch (e) {
      console.error('Unable to chat', e);
      return '';
    }
  }

  async queryToPlaceApi(parameters: string): Promise<{ [key: string]: any }> {
    console.log(decodeURIComponent(parameters));
    const res = await fetch('https://api.foursquare.com/v3/places/search?' + parameters, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `${process.env.PLACE_API_KEY}`,
      },
    });

    if (!res.ok) {
      console.log('Failed to fetch restuarant => ', res.ok, res.statusText, +'(' + res.status + ')');
      return {};
    }

    const result = await res.json();
    return result;
    //  fs.writeFileSync('food.json', JSON.stringify(result, null, 2))
  }

  async findRestaurant(message: string, location: any[]): Promise<TFindRestaurantResponse> {
    const serverError = 'An error occured. If this issue persists please contact us through our help center';

    const response: TFindRestaurantResponse = {
      success: false,
      serverErrorMessage: '',
      llmWarnMessage: '',
      data: [],
    };

    let chatResponse1 = await this.chatToLLM(this.modelOllama, message, restaurantFinderPromptTemplate, { message: message });

    chatResponse1 = chatResponse1.replace(/\n/g, ' ').trim();
    console.log(chatResponse1);

    let parseChatResponse: { action: string; parameters: { [key: string]: any }; message?: string } | null = null;

    try {
      parseChatResponse = JSON.parse(chatResponse1);
    } catch (e) {
      console.error('Unable to parse chat response 1 \n', chatResponse1);
      console.error(e);
    }

    if (!parseChatResponse) {
      response.serverErrorMessage = serverError;
      return response;
    }

    if (parseChatResponse.action === 'failed_restaurant_search') {
      response.llmWarnMessage = parseChatResponse.message as string;
      return response;
    }

    if (location && location.indexOf(null) == -1) {
      parseChatResponse.parameters.ll = location.join(',');
    }

    parseChatResponse.parameters.fields = 'name,location,hours_popular,hours,menu,price,rating,meals,food_and_drink';
    parseChatResponse.parameters.limit = 10;
    parseChatResponse.parameters.radius = 100000;
    const encodedParam = encodeURIComponent(new URLSearchParams(parseChatResponse?.parameters).toString());

    if (!encodedParam) {
      response.serverErrorMessage = serverError;
      return response;
    }

    const searchPlaceResult = await this.queryToPlaceApi(encodedParam);
    const isEmpty = Object.keys(searchPlaceResult).length == 0;

    let chatResponse2 = await this.chatToLLM(
      this.modelOllama,
      message,
      restaurantResultPromptTemplate,
      {
        json: isEmpty ? '' : JSON.stringify(searchPlaceResult),
      },
      false,
      { chunkSize: 4000, chunkOverlap: 500 }
    );

    chatResponse2 = chatResponse2.replace(/\n/g, ' ').trim();

    let parseChatResponse2: { message: string } | null = null;

    try {
      parseChatResponse2 = JSON.parse(chatResponse2);
    } catch (e) {
      console.error('Unable to parse chat response 2 \n', chatResponse2);
      console.error(e);
    }

    if (parseChatResponse2) {
      response.data?.push({
        type: 'LLM_ADDITIONAL_FIRST_MESSAGE',
        message: parseChatResponse2.message,
      });
    }

    response.data?.push({
      type: 'RESTAURANT_RESULTS',
      results: searchPlaceResult.results ?? [],
    });

    response.success = true;
    return response;
  }
}

export { RestaurantFinderService };

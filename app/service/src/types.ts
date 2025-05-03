import { FastifyPluginOptions } from 'fastify';


export type TFindRestaurantResponse = {
  success: boolean,
  serverErrorMessage: string
  llmWarnMessage: string,
  data: any[] | null
}


export interface IRestaurantFinderService {
  chatToLLM(model: any, message: string, propmtTemplate: string, prompTemplateOption: any): Promise<string>
  queryToPlaceApi(parameters: string): Promise<{[key: string]: unknown}>;
  findRestaurant(message: string, location?: number[]): Promise<TFindRestaurantResponse>
}

export interface IExecute {
  message: string;
  location?: number[]
}

export type TOption = {
  prefix: string;
  rfs: IRestaurantFinderService;
} & FastifyPluginOptions;

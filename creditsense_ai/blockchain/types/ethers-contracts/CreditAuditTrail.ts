import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, ContractRunner, ContractMethod, Listener } from "ethers"
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "./common.js"
  
export declare namespace CreditAuditTrail {
      
    export type AuditEntryStruct = {loanId: string, entryType: BigNumberish, dataHash: BytesLike, timestamp: BigNumberish, actionCode: BigNumberish}

    export type AuditEntryStructOutput = [loanId: string, entryType: bigint, dataHash: string, timestamp: bigint, actionCode: bigint] & {loanId: string, entryType: bigint, dataHash: string, timestamp: bigint, actionCode: bigint }
  
    }

  export interface CreditAuditTrailInterface extends Interface {
    getFunction(nameOrSignature: "getAuditTrail" | "logAction" | "logDecision" | "logDocument"): FunctionFragment;

    getEvent(nameOrSignatureOrTopic: "AuditLogged"): EventFragment;

    encodeFunctionData(functionFragment: 'getAuditTrail', values: [string]): string;
encodeFunctionData(functionFragment: 'logAction', values: [string, BigNumberish, BytesLike]): string;
encodeFunctionData(functionFragment: 'logDecision', values: [string, string, BytesLike]): string;
encodeFunctionData(functionFragment: 'logDocument', values: [string, string, BytesLike]): string;

    decodeFunctionResult(functionFragment: 'getAuditTrail', data: BytesLike): Result;
decodeFunctionResult(functionFragment: 'logAction', data: BytesLike): Result;
decodeFunctionResult(functionFragment: 'logDecision', data: BytesLike): Result;
decodeFunctionResult(functionFragment: 'logDocument', data: BytesLike): Result;
  }

  
    export namespace AuditLoggedEvent {
      export type InputTuple = [loanId: string, entryType: string, timestamp: BigNumberish];
      export type OutputTuple = [loanId: string, entryType: string, timestamp: bigint];
      export interface OutputObject {loanId: string, entryType: string, timestamp: bigint };
      export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>
      export type Filter = TypedDeferredTopicFilter<Event>
      export type Log = TypedEventLog<Event>
      export type LogDescription = TypedLogDescription<Event>
    }

  

  export interface CreditAuditTrail extends BaseContract {
    
    connect(runner?: ContractRunner | null): CreditAuditTrail;
    waitForDeployment(): Promise<this>;

    interface: CreditAuditTrailInterface;

    
  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined,
  ): Promise<Array<TypedEventLog<TCEvent>>>
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>
  on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>
  
  once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>
  once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>
  removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>


    
    
    getAuditTrail: TypedContractMethod<
      [_loanId: string, ],
      [CreditAuditTrail.AuditEntryStructOutput[]],
      'view'
    >
    

    
    logAction: TypedContractMethod<
      [_loanId: string, _actionCode: BigNumberish, _stateHash: BytesLike, ],
      [void],
      'nonpayable'
    >
    

    
    logDecision: TypedContractMethod<
      [_loanId: string, _decision: string, _camHash: BytesLike, ],
      [void],
      'nonpayable'
    >
    

    
    logDocument: TypedContractMethod<
      [_loanId: string, _docType: string, _docHash: BytesLike, ],
      [void],
      'nonpayable'
    >
    


    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;

    getFunction(nameOrSignature: 'getAuditTrail'): TypedContractMethod<
      [_loanId: string, ],
      [CreditAuditTrail.AuditEntryStructOutput[]],
      'view'
    >;
getFunction(nameOrSignature: 'logAction'): TypedContractMethod<
      [_loanId: string, _actionCode: BigNumberish, _stateHash: BytesLike, ],
      [void],
      'nonpayable'
    >;
getFunction(nameOrSignature: 'logDecision'): TypedContractMethod<
      [_loanId: string, _decision: string, _camHash: BytesLike, ],
      [void],
      'nonpayable'
    >;
getFunction(nameOrSignature: 'logDocument'): TypedContractMethod<
      [_loanId: string, _docType: string, _docHash: BytesLike, ],
      [void],
      'nonpayable'
    >;

    getEvent(key: 'AuditLogged'): TypedContractEvent<AuditLoggedEvent.InputTuple, AuditLoggedEvent.OutputTuple, AuditLoggedEvent.OutputObject>;

    filters: {
      
      'AuditLogged(string,string,uint256)': TypedContractEvent<AuditLoggedEvent.InputTuple, AuditLoggedEvent.OutputTuple, AuditLoggedEvent.OutputObject>;
      AuditLogged: TypedContractEvent<AuditLoggedEvent.InputTuple, AuditLoggedEvent.OutputTuple, AuditLoggedEvent.OutputObject>;
    
    };
  }
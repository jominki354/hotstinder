
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model UserRole
 * 
 */
export type UserRole = $Result.DefaultSelection<Prisma.$UserRolePayload>
/**
 * Model Match
 * 
 */
export type Match = $Result.DefaultSelection<Prisma.$MatchPayload>
/**
 * Model MatchPlayer
 * 
 */
export type MatchPlayer = $Result.DefaultSelection<Prisma.$MatchPlayerPayload>
/**
 * Model PlayerStat
 * 
 */
export type PlayerStat = $Result.DefaultSelection<Prisma.$PlayerStatPayload>
/**
 * Model MmrChange
 * 
 */
export type MmrChange = $Result.DefaultSelection<Prisma.$MmrChangePayload>
/**
 * Model EventLog
 * 
 */
export type EventLog = $Result.DefaultSelection<Prisma.$EventLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const MatchStatus: {
  OPEN: 'OPEN',
  FULL: 'FULL',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus]


export const Team: {
  BLUE: 'BLUE',
  RED: 'RED'
};

export type Team = (typeof Team)[keyof typeof Team]

}

export type MatchStatus = $Enums.MatchStatus

export const MatchStatus: typeof $Enums.MatchStatus

export type Team = $Enums.Team

export const Team: typeof $Enums.Team

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userRole`: Exposes CRUD operations for the **UserRole** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserRoles
    * const userRoles = await prisma.userRole.findMany()
    * ```
    */
  get userRole(): Prisma.UserRoleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.match`: Exposes CRUD operations for the **Match** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Matches
    * const matches = await prisma.match.findMany()
    * ```
    */
  get match(): Prisma.MatchDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.matchPlayer`: Exposes CRUD operations for the **MatchPlayer** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MatchPlayers
    * const matchPlayers = await prisma.matchPlayer.findMany()
    * ```
    */
  get matchPlayer(): Prisma.MatchPlayerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.playerStat`: Exposes CRUD operations for the **PlayerStat** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PlayerStats
    * const playerStats = await prisma.playerStat.findMany()
    * ```
    */
  get playerStat(): Prisma.PlayerStatDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.mmrChange`: Exposes CRUD operations for the **MmrChange** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MmrChanges
    * const mmrChanges = await prisma.mmrChange.findMany()
    * ```
    */
  get mmrChange(): Prisma.MmrChangeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventLog`: Exposes CRUD operations for the **EventLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventLogs
    * const eventLogs = await prisma.eventLog.findMany()
    * ```
    */
  get eventLog(): Prisma.EventLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    UserRole: 'UserRole',
    Match: 'Match',
    MatchPlayer: 'MatchPlayer',
    PlayerStat: 'PlayerStat',
    MmrChange: 'MmrChange',
    EventLog: 'EventLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "userRole" | "match" | "matchPlayer" | "playerStat" | "mmrChange" | "eventLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      UserRole: {
        payload: Prisma.$UserRolePayload<ExtArgs>
        fields: Prisma.UserRoleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserRoleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserRoleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          findFirst: {
            args: Prisma.UserRoleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserRoleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          findMany: {
            args: Prisma.UserRoleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>[]
          }
          create: {
            args: Prisma.UserRoleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          createMany: {
            args: Prisma.UserRoleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserRoleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>[]
          }
          delete: {
            args: Prisma.UserRoleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          update: {
            args: Prisma.UserRoleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          deleteMany: {
            args: Prisma.UserRoleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserRoleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserRoleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>[]
          }
          upsert: {
            args: Prisma.UserRoleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRolePayload>
          }
          aggregate: {
            args: Prisma.UserRoleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserRole>
          }
          groupBy: {
            args: Prisma.UserRoleGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserRoleGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserRoleCountArgs<ExtArgs>
            result: $Utils.Optional<UserRoleCountAggregateOutputType> | number
          }
        }
      }
      Match: {
        payload: Prisma.$MatchPayload<ExtArgs>
        fields: Prisma.MatchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MatchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MatchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          findFirst: {
            args: Prisma.MatchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MatchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          findMany: {
            args: Prisma.MatchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          create: {
            args: Prisma.MatchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          createMany: {
            args: Prisma.MatchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MatchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          delete: {
            args: Prisma.MatchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          update: {
            args: Prisma.MatchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          deleteMany: {
            args: Prisma.MatchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MatchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MatchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          upsert: {
            args: Prisma.MatchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          aggregate: {
            args: Prisma.MatchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMatch>
          }
          groupBy: {
            args: Prisma.MatchGroupByArgs<ExtArgs>
            result: $Utils.Optional<MatchGroupByOutputType>[]
          }
          count: {
            args: Prisma.MatchCountArgs<ExtArgs>
            result: $Utils.Optional<MatchCountAggregateOutputType> | number
          }
        }
      }
      MatchPlayer: {
        payload: Prisma.$MatchPlayerPayload<ExtArgs>
        fields: Prisma.MatchPlayerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MatchPlayerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MatchPlayerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          findFirst: {
            args: Prisma.MatchPlayerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MatchPlayerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          findMany: {
            args: Prisma.MatchPlayerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>[]
          }
          create: {
            args: Prisma.MatchPlayerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          createMany: {
            args: Prisma.MatchPlayerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MatchPlayerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>[]
          }
          delete: {
            args: Prisma.MatchPlayerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          update: {
            args: Prisma.MatchPlayerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          deleteMany: {
            args: Prisma.MatchPlayerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MatchPlayerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MatchPlayerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>[]
          }
          upsert: {
            args: Prisma.MatchPlayerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPlayerPayload>
          }
          aggregate: {
            args: Prisma.MatchPlayerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMatchPlayer>
          }
          groupBy: {
            args: Prisma.MatchPlayerGroupByArgs<ExtArgs>
            result: $Utils.Optional<MatchPlayerGroupByOutputType>[]
          }
          count: {
            args: Prisma.MatchPlayerCountArgs<ExtArgs>
            result: $Utils.Optional<MatchPlayerCountAggregateOutputType> | number
          }
        }
      }
      PlayerStat: {
        payload: Prisma.$PlayerStatPayload<ExtArgs>
        fields: Prisma.PlayerStatFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PlayerStatFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PlayerStatFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          findFirst: {
            args: Prisma.PlayerStatFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PlayerStatFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          findMany: {
            args: Prisma.PlayerStatFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>[]
          }
          create: {
            args: Prisma.PlayerStatCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          createMany: {
            args: Prisma.PlayerStatCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PlayerStatCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>[]
          }
          delete: {
            args: Prisma.PlayerStatDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          update: {
            args: Prisma.PlayerStatUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          deleteMany: {
            args: Prisma.PlayerStatDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PlayerStatUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PlayerStatUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>[]
          }
          upsert: {
            args: Prisma.PlayerStatUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatPayload>
          }
          aggregate: {
            args: Prisma.PlayerStatAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePlayerStat>
          }
          groupBy: {
            args: Prisma.PlayerStatGroupByArgs<ExtArgs>
            result: $Utils.Optional<PlayerStatGroupByOutputType>[]
          }
          count: {
            args: Prisma.PlayerStatCountArgs<ExtArgs>
            result: $Utils.Optional<PlayerStatCountAggregateOutputType> | number
          }
        }
      }
      MmrChange: {
        payload: Prisma.$MmrChangePayload<ExtArgs>
        fields: Prisma.MmrChangeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MmrChangeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MmrChangeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          findFirst: {
            args: Prisma.MmrChangeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MmrChangeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          findMany: {
            args: Prisma.MmrChangeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>[]
          }
          create: {
            args: Prisma.MmrChangeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          createMany: {
            args: Prisma.MmrChangeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MmrChangeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>[]
          }
          delete: {
            args: Prisma.MmrChangeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          update: {
            args: Prisma.MmrChangeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          deleteMany: {
            args: Prisma.MmrChangeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MmrChangeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MmrChangeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>[]
          }
          upsert: {
            args: Prisma.MmrChangeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MmrChangePayload>
          }
          aggregate: {
            args: Prisma.MmrChangeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMmrChange>
          }
          groupBy: {
            args: Prisma.MmrChangeGroupByArgs<ExtArgs>
            result: $Utils.Optional<MmrChangeGroupByOutputType>[]
          }
          count: {
            args: Prisma.MmrChangeCountArgs<ExtArgs>
            result: $Utils.Optional<MmrChangeCountAggregateOutputType> | number
          }
        }
      }
      EventLog: {
        payload: Prisma.$EventLogPayload<ExtArgs>
        fields: Prisma.EventLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findFirst: {
            args: Prisma.EventLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findMany: {
            args: Prisma.EventLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          create: {
            args: Prisma.EventLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          createMany: {
            args: Prisma.EventLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          delete: {
            args: Prisma.EventLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          update: {
            args: Prisma.EventLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          deleteMany: {
            args: Prisma.EventLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          upsert: {
            args: Prisma.EventLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          aggregate: {
            args: Prisma.EventLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventLog>
          }
          groupBy: {
            args: Prisma.EventLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventLogCountArgs<ExtArgs>
            result: $Utils.Optional<EventLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    userRole?: UserRoleOmit
    match?: MatchOmit
    matchPlayer?: MatchPlayerOmit
    playerStat?: PlayerStatOmit
    mmrChange?: MmrChangeOmit
    eventLog?: EventLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    roles: number
    createdMatches: number
    matchPlayers: number
    playerStats: number
    mmrChanges: number
    eventLogs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | UserCountOutputTypeCountRolesArgs
    createdMatches?: boolean | UserCountOutputTypeCountCreatedMatchesArgs
    matchPlayers?: boolean | UserCountOutputTypeCountMatchPlayersArgs
    playerStats?: boolean | UserCountOutputTypeCountPlayerStatsArgs
    mmrChanges?: boolean | UserCountOutputTypeCountMmrChangesArgs
    eventLogs?: boolean | UserCountOutputTypeCountEventLogsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserRoleWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCreatedMatchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMatchPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchPlayerWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPlayerStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerStatWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMmrChangesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MmrChangeWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEventLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
  }


  /**
   * Count Type MatchCountOutputType
   */

  export type MatchCountOutputType = {
    players: number
    playerStats: number
    mmrChanges: number
    eventLogs: number
  }

  export type MatchCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    players?: boolean | MatchCountOutputTypeCountPlayersArgs
    playerStats?: boolean | MatchCountOutputTypeCountPlayerStatsArgs
    mmrChanges?: boolean | MatchCountOutputTypeCountMmrChangesArgs
    eventLogs?: boolean | MatchCountOutputTypeCountEventLogsArgs
  }

  // Custom InputTypes
  /**
   * MatchCountOutputType without action
   */
  export type MatchCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchCountOutputType
     */
    select?: MatchCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MatchCountOutputType without action
   */
  export type MatchCountOutputTypeCountPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchPlayerWhereInput
  }

  /**
   * MatchCountOutputType without action
   */
  export type MatchCountOutputTypeCountPlayerStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerStatWhereInput
  }

  /**
   * MatchCountOutputType without action
   */
  export type MatchCountOutputTypeCountMmrChangesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MmrChangeWhereInput
  }

  /**
   * MatchCountOutputType without action
   */
  export type MatchCountOutputTypeCountEventLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    mmr: number | null
    wins: number | null
    losses: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
    mmr: number | null
    wins: number | null
    losses: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    bnetId: string | null
    battletag: string | null
    nickname: string | null
    profilePicture: string | null
    mmr: number | null
    wins: number | null
    losses: number | null
    isAdmin: boolean | null
    isDummy: boolean | null
    createdAt: Date | null
    lastLogin: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    bnetId: string | null
    battletag: string | null
    nickname: string | null
    profilePicture: string | null
    mmr: number | null
    wins: number | null
    losses: number | null
    isAdmin: boolean | null
    isDummy: boolean | null
    createdAt: Date | null
    lastLogin: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    bnetId: number
    battletag: number
    nickname: number
    profilePicture: number
    mmr: number
    wins: number
    losses: number
    isAdmin: number
    isDummy: number
    createdAt: number
    lastLogin: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    mmr?: true
    wins?: true
    losses?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    mmr?: true
    wins?: true
    losses?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    bnetId?: true
    battletag?: true
    nickname?: true
    profilePicture?: true
    mmr?: true
    wins?: true
    losses?: true
    isAdmin?: true
    isDummy?: true
    createdAt?: true
    lastLogin?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    bnetId?: true
    battletag?: true
    nickname?: true
    profilePicture?: true
    mmr?: true
    wins?: true
    losses?: true
    isAdmin?: true
    isDummy?: true
    createdAt?: true
    lastLogin?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    bnetId?: true
    battletag?: true
    nickname?: true
    profilePicture?: true
    mmr?: true
    wins?: true
    losses?: true
    isAdmin?: true
    isDummy?: true
    createdAt?: true
    lastLogin?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture: string | null
    mmr: number
    wins: number
    losses: number
    isAdmin: boolean
    isDummy: boolean
    createdAt: Date
    lastLogin: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bnetId?: boolean
    battletag?: boolean
    nickname?: boolean
    profilePicture?: boolean
    mmr?: boolean
    wins?: boolean
    losses?: boolean
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: boolean
    lastLogin?: boolean
    roles?: boolean | User$rolesArgs<ExtArgs>
    createdMatches?: boolean | User$createdMatchesArgs<ExtArgs>
    matchPlayers?: boolean | User$matchPlayersArgs<ExtArgs>
    playerStats?: boolean | User$playerStatsArgs<ExtArgs>
    mmrChanges?: boolean | User$mmrChangesArgs<ExtArgs>
    eventLogs?: boolean | User$eventLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bnetId?: boolean
    battletag?: boolean
    nickname?: boolean
    profilePicture?: boolean
    mmr?: boolean
    wins?: boolean
    losses?: boolean
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bnetId?: boolean
    battletag?: boolean
    nickname?: boolean
    profilePicture?: boolean
    mmr?: boolean
    wins?: boolean
    losses?: boolean
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    bnetId?: boolean
    battletag?: boolean
    nickname?: boolean
    profilePicture?: boolean
    mmr?: boolean
    wins?: boolean
    losses?: boolean
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "bnetId" | "battletag" | "nickname" | "profilePicture" | "mmr" | "wins" | "losses" | "isAdmin" | "isDummy" | "createdAt" | "lastLogin", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | User$rolesArgs<ExtArgs>
    createdMatches?: boolean | User$createdMatchesArgs<ExtArgs>
    matchPlayers?: boolean | User$matchPlayersArgs<ExtArgs>
    playerStats?: boolean | User$playerStatsArgs<ExtArgs>
    mmrChanges?: boolean | User$mmrChangesArgs<ExtArgs>
    eventLogs?: boolean | User$eventLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      roles: Prisma.$UserRolePayload<ExtArgs>[]
      createdMatches: Prisma.$MatchPayload<ExtArgs>[]
      matchPlayers: Prisma.$MatchPlayerPayload<ExtArgs>[]
      playerStats: Prisma.$PlayerStatPayload<ExtArgs>[]
      mmrChanges: Prisma.$MmrChangePayload<ExtArgs>[]
      eventLogs: Prisma.$EventLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      bnetId: string
      battletag: string
      nickname: string
      profilePicture: string | null
      mmr: number
      wins: number
      losses: number
      isAdmin: boolean
      isDummy: boolean
      createdAt: Date
      lastLogin: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    roles<T extends User$rolesArgs<ExtArgs> = {}>(args?: Subset<T, User$rolesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    createdMatches<T extends User$createdMatchesArgs<ExtArgs> = {}>(args?: Subset<T, User$createdMatchesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    matchPlayers<T extends User$matchPlayersArgs<ExtArgs> = {}>(args?: Subset<T, User$matchPlayersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    playerStats<T extends User$playerStatsArgs<ExtArgs> = {}>(args?: Subset<T, User$playerStatsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    mmrChanges<T extends User$mmrChangesArgs<ExtArgs> = {}>(args?: Subset<T, User$mmrChangesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    eventLogs<T extends User$eventLogsArgs<ExtArgs> = {}>(args?: Subset<T, User$eventLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly bnetId: FieldRef<"User", 'String'>
    readonly battletag: FieldRef<"User", 'String'>
    readonly nickname: FieldRef<"User", 'String'>
    readonly profilePicture: FieldRef<"User", 'String'>
    readonly mmr: FieldRef<"User", 'Int'>
    readonly wins: FieldRef<"User", 'Int'>
    readonly losses: FieldRef<"User", 'Int'>
    readonly isAdmin: FieldRef<"User", 'Boolean'>
    readonly isDummy: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly lastLogin: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.roles
   */
  export type User$rolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    where?: UserRoleWhereInput
    orderBy?: UserRoleOrderByWithRelationInput | UserRoleOrderByWithRelationInput[]
    cursor?: UserRoleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserRoleScalarFieldEnum | UserRoleScalarFieldEnum[]
  }

  /**
   * User.createdMatches
   */
  export type User$createdMatchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    where?: MatchWhereInput
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    cursor?: MatchWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * User.matchPlayers
   */
  export type User$matchPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    where?: MatchPlayerWhereInput
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    cursor?: MatchPlayerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MatchPlayerScalarFieldEnum | MatchPlayerScalarFieldEnum[]
  }

  /**
   * User.playerStats
   */
  export type User$playerStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    where?: PlayerStatWhereInput
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    cursor?: PlayerStatWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PlayerStatScalarFieldEnum | PlayerStatScalarFieldEnum[]
  }

  /**
   * User.mmrChanges
   */
  export type User$mmrChangesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    where?: MmrChangeWhereInput
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    cursor?: MmrChangeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MmrChangeScalarFieldEnum | MmrChangeScalarFieldEnum[]
  }

  /**
   * User.eventLogs
   */
  export type User$eventLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    cursor?: EventLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model UserRole
   */

  export type AggregateUserRole = {
    _count: UserRoleCountAggregateOutputType | null
    _avg: UserRoleAvgAggregateOutputType | null
    _sum: UserRoleSumAggregateOutputType | null
    _min: UserRoleMinAggregateOutputType | null
    _max: UserRoleMaxAggregateOutputType | null
  }

  export type UserRoleAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type UserRoleSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type UserRoleMinAggregateOutputType = {
    id: number | null
    userId: number | null
    role: string | null
  }

  export type UserRoleMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    role: string | null
  }

  export type UserRoleCountAggregateOutputType = {
    id: number
    userId: number
    role: number
    _all: number
  }


  export type UserRoleAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type UserRoleSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type UserRoleMinAggregateInputType = {
    id?: true
    userId?: true
    role?: true
  }

  export type UserRoleMaxAggregateInputType = {
    id?: true
    userId?: true
    role?: true
  }

  export type UserRoleCountAggregateInputType = {
    id?: true
    userId?: true
    role?: true
    _all?: true
  }

  export type UserRoleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRole to aggregate.
     */
    where?: UserRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRoles to fetch.
     */
    orderBy?: UserRoleOrderByWithRelationInput | UserRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserRoles
    **/
    _count?: true | UserRoleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserRoleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserRoleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserRoleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserRoleMaxAggregateInputType
  }

  export type GetUserRoleAggregateType<T extends UserRoleAggregateArgs> = {
        [P in keyof T & keyof AggregateUserRole]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserRole[P]>
      : GetScalarType<T[P], AggregateUserRole[P]>
  }




  export type UserRoleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserRoleWhereInput
    orderBy?: UserRoleOrderByWithAggregationInput | UserRoleOrderByWithAggregationInput[]
    by: UserRoleScalarFieldEnum[] | UserRoleScalarFieldEnum
    having?: UserRoleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserRoleCountAggregateInputType | true
    _avg?: UserRoleAvgAggregateInputType
    _sum?: UserRoleSumAggregateInputType
    _min?: UserRoleMinAggregateInputType
    _max?: UserRoleMaxAggregateInputType
  }

  export type UserRoleGroupByOutputType = {
    id: number
    userId: number
    role: string
    _count: UserRoleCountAggregateOutputType | null
    _avg: UserRoleAvgAggregateOutputType | null
    _sum: UserRoleSumAggregateOutputType | null
    _min: UserRoleMinAggregateOutputType | null
    _max: UserRoleMaxAggregateOutputType | null
  }

  type GetUserRoleGroupByPayload<T extends UserRoleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserRoleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserRoleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserRoleGroupByOutputType[P]>
            : GetScalarType<T[P], UserRoleGroupByOutputType[P]>
        }
      >
    >


  export type UserRoleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    role?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRole"]>

  export type UserRoleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    role?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRole"]>

  export type UserRoleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    role?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userRole"]>

  export type UserRoleSelectScalar = {
    id?: boolean
    userId?: boolean
    role?: boolean
  }

  export type UserRoleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "role", ExtArgs["result"]["userRole"]>
  export type UserRoleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserRoleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserRoleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UserRolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserRole"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      role: string
    }, ExtArgs["result"]["userRole"]>
    composites: {}
  }

  type UserRoleGetPayload<S extends boolean | null | undefined | UserRoleDefaultArgs> = $Result.GetResult<Prisma.$UserRolePayload, S>

  type UserRoleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserRoleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserRoleCountAggregateInputType | true
    }

  export interface UserRoleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserRole'], meta: { name: 'UserRole' } }
    /**
     * Find zero or one UserRole that matches the filter.
     * @param {UserRoleFindUniqueArgs} args - Arguments to find a UserRole
     * @example
     * // Get one UserRole
     * const userRole = await prisma.userRole.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserRoleFindUniqueArgs>(args: SelectSubset<T, UserRoleFindUniqueArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserRole that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserRoleFindUniqueOrThrowArgs} args - Arguments to find a UserRole
     * @example
     * // Get one UserRole
     * const userRole = await prisma.userRole.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserRoleFindUniqueOrThrowArgs>(args: SelectSubset<T, UserRoleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRole that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleFindFirstArgs} args - Arguments to find a UserRole
     * @example
     * // Get one UserRole
     * const userRole = await prisma.userRole.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserRoleFindFirstArgs>(args?: SelectSubset<T, UserRoleFindFirstArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRole that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleFindFirstOrThrowArgs} args - Arguments to find a UserRole
     * @example
     * // Get one UserRole
     * const userRole = await prisma.userRole.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserRoleFindFirstOrThrowArgs>(args?: SelectSubset<T, UserRoleFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserRoles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserRoles
     * const userRoles = await prisma.userRole.findMany()
     * 
     * // Get first 10 UserRoles
     * const userRoles = await prisma.userRole.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userRoleWithIdOnly = await prisma.userRole.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserRoleFindManyArgs>(args?: SelectSubset<T, UserRoleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserRole.
     * @param {UserRoleCreateArgs} args - Arguments to create a UserRole.
     * @example
     * // Create one UserRole
     * const UserRole = await prisma.userRole.create({
     *   data: {
     *     // ... data to create a UserRole
     *   }
     * })
     * 
     */
    create<T extends UserRoleCreateArgs>(args: SelectSubset<T, UserRoleCreateArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserRoles.
     * @param {UserRoleCreateManyArgs} args - Arguments to create many UserRoles.
     * @example
     * // Create many UserRoles
     * const userRole = await prisma.userRole.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserRoleCreateManyArgs>(args?: SelectSubset<T, UserRoleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserRoles and returns the data saved in the database.
     * @param {UserRoleCreateManyAndReturnArgs} args - Arguments to create many UserRoles.
     * @example
     * // Create many UserRoles
     * const userRole = await prisma.userRole.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserRoles and only return the `id`
     * const userRoleWithIdOnly = await prisma.userRole.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserRoleCreateManyAndReturnArgs>(args?: SelectSubset<T, UserRoleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserRole.
     * @param {UserRoleDeleteArgs} args - Arguments to delete one UserRole.
     * @example
     * // Delete one UserRole
     * const UserRole = await prisma.userRole.delete({
     *   where: {
     *     // ... filter to delete one UserRole
     *   }
     * })
     * 
     */
    delete<T extends UserRoleDeleteArgs>(args: SelectSubset<T, UserRoleDeleteArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserRole.
     * @param {UserRoleUpdateArgs} args - Arguments to update one UserRole.
     * @example
     * // Update one UserRole
     * const userRole = await prisma.userRole.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserRoleUpdateArgs>(args: SelectSubset<T, UserRoleUpdateArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserRoles.
     * @param {UserRoleDeleteManyArgs} args - Arguments to filter UserRoles to delete.
     * @example
     * // Delete a few UserRoles
     * const { count } = await prisma.userRole.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserRoleDeleteManyArgs>(args?: SelectSubset<T, UserRoleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRoles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserRoles
     * const userRole = await prisma.userRole.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserRoleUpdateManyArgs>(args: SelectSubset<T, UserRoleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRoles and returns the data updated in the database.
     * @param {UserRoleUpdateManyAndReturnArgs} args - Arguments to update many UserRoles.
     * @example
     * // Update many UserRoles
     * const userRole = await prisma.userRole.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserRoles and only return the `id`
     * const userRoleWithIdOnly = await prisma.userRole.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserRoleUpdateManyAndReturnArgs>(args: SelectSubset<T, UserRoleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserRole.
     * @param {UserRoleUpsertArgs} args - Arguments to update or create a UserRole.
     * @example
     * // Update or create a UserRole
     * const userRole = await prisma.userRole.upsert({
     *   create: {
     *     // ... data to create a UserRole
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserRole we want to update
     *   }
     * })
     */
    upsert<T extends UserRoleUpsertArgs>(args: SelectSubset<T, UserRoleUpsertArgs<ExtArgs>>): Prisma__UserRoleClient<$Result.GetResult<Prisma.$UserRolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserRoles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleCountArgs} args - Arguments to filter UserRoles to count.
     * @example
     * // Count the number of UserRoles
     * const count = await prisma.userRole.count({
     *   where: {
     *     // ... the filter for the UserRoles we want to count
     *   }
     * })
    **/
    count<T extends UserRoleCountArgs>(
      args?: Subset<T, UserRoleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserRoleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserRole.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserRoleAggregateArgs>(args: Subset<T, UserRoleAggregateArgs>): Prisma.PrismaPromise<GetUserRoleAggregateType<T>>

    /**
     * Group by UserRole.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRoleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserRoleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserRoleGroupByArgs['orderBy'] }
        : { orderBy?: UserRoleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserRoleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserRoleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserRole model
   */
  readonly fields: UserRoleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserRole.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserRoleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserRole model
   */
  interface UserRoleFieldRefs {
    readonly id: FieldRef<"UserRole", 'Int'>
    readonly userId: FieldRef<"UserRole", 'Int'>
    readonly role: FieldRef<"UserRole", 'String'>
  }
    

  // Custom InputTypes
  /**
   * UserRole findUnique
   */
  export type UserRoleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter, which UserRole to fetch.
     */
    where: UserRoleWhereUniqueInput
  }

  /**
   * UserRole findUniqueOrThrow
   */
  export type UserRoleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter, which UserRole to fetch.
     */
    where: UserRoleWhereUniqueInput
  }

  /**
   * UserRole findFirst
   */
  export type UserRoleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter, which UserRole to fetch.
     */
    where?: UserRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRoles to fetch.
     */
    orderBy?: UserRoleOrderByWithRelationInput | UserRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRoles.
     */
    cursor?: UserRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRoles.
     */
    distinct?: UserRoleScalarFieldEnum | UserRoleScalarFieldEnum[]
  }

  /**
   * UserRole findFirstOrThrow
   */
  export type UserRoleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter, which UserRole to fetch.
     */
    where?: UserRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRoles to fetch.
     */
    orderBy?: UserRoleOrderByWithRelationInput | UserRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRoles.
     */
    cursor?: UserRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRoles.
     */
    distinct?: UserRoleScalarFieldEnum | UserRoleScalarFieldEnum[]
  }

  /**
   * UserRole findMany
   */
  export type UserRoleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter, which UserRoles to fetch.
     */
    where?: UserRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRoles to fetch.
     */
    orderBy?: UserRoleOrderByWithRelationInput | UserRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserRoles.
     */
    cursor?: UserRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRoles.
     */
    skip?: number
    distinct?: UserRoleScalarFieldEnum | UserRoleScalarFieldEnum[]
  }

  /**
   * UserRole create
   */
  export type UserRoleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * The data needed to create a UserRole.
     */
    data: XOR<UserRoleCreateInput, UserRoleUncheckedCreateInput>
  }

  /**
   * UserRole createMany
   */
  export type UserRoleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserRoles.
     */
    data: UserRoleCreateManyInput | UserRoleCreateManyInput[]
  }

  /**
   * UserRole createManyAndReturn
   */
  export type UserRoleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * The data used to create many UserRoles.
     */
    data: UserRoleCreateManyInput | UserRoleCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserRole update
   */
  export type UserRoleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * The data needed to update a UserRole.
     */
    data: XOR<UserRoleUpdateInput, UserRoleUncheckedUpdateInput>
    /**
     * Choose, which UserRole to update.
     */
    where: UserRoleWhereUniqueInput
  }

  /**
   * UserRole updateMany
   */
  export type UserRoleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserRoles.
     */
    data: XOR<UserRoleUpdateManyMutationInput, UserRoleUncheckedUpdateManyInput>
    /**
     * Filter which UserRoles to update
     */
    where?: UserRoleWhereInput
    /**
     * Limit how many UserRoles to update.
     */
    limit?: number
  }

  /**
   * UserRole updateManyAndReturn
   */
  export type UserRoleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * The data used to update UserRoles.
     */
    data: XOR<UserRoleUpdateManyMutationInput, UserRoleUncheckedUpdateManyInput>
    /**
     * Filter which UserRoles to update
     */
    where?: UserRoleWhereInput
    /**
     * Limit how many UserRoles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserRole upsert
   */
  export type UserRoleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * The filter to search for the UserRole to update in case it exists.
     */
    where: UserRoleWhereUniqueInput
    /**
     * In case the UserRole found by the `where` argument doesn't exist, create a new UserRole with this data.
     */
    create: XOR<UserRoleCreateInput, UserRoleUncheckedCreateInput>
    /**
     * In case the UserRole was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserRoleUpdateInput, UserRoleUncheckedUpdateInput>
  }

  /**
   * UserRole delete
   */
  export type UserRoleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
    /**
     * Filter which UserRole to delete.
     */
    where: UserRoleWhereUniqueInput
  }

  /**
   * UserRole deleteMany
   */
  export type UserRoleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRoles to delete
     */
    where?: UserRoleWhereInput
    /**
     * Limit how many UserRoles to delete.
     */
    limit?: number
  }

  /**
   * UserRole without action
   */
  export type UserRoleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRole
     */
    select?: UserRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRole
     */
    omit?: UserRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserRoleInclude<ExtArgs> | null
  }


  /**
   * Model Match
   */

  export type AggregateMatch = {
    _count: MatchCountAggregateOutputType | null
    _avg: MatchAvgAggregateOutputType | null
    _sum: MatchSumAggregateOutputType | null
    _min: MatchMinAggregateOutputType | null
    _max: MatchMaxAggregateOutputType | null
  }

  export type MatchAvgAggregateOutputType = {
    id: number | null
    createdById: number | null
    maxPlayers: number | null
    blueScore: number | null
    redScore: number | null
    duration: number | null
  }

  export type MatchSumAggregateOutputType = {
    id: number | null
    createdById: number | null
    maxPlayers: number | null
    blueScore: number | null
    redScore: number | null
    duration: number | null
  }

  export type MatchMinAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    createdById: number | null
    status: $Enums.MatchStatus | null
    gameMode: string | null
    maxPlayers: number | null
    map: string | null
    isPrivate: boolean | null
    password: string | null
    balanceType: string | null
    isSimulation: boolean | null
    originalMatchId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    scheduledTime: Date | null
    winner: string | null
    blueScore: number | null
    redScore: number | null
    duration: number | null
  }

  export type MatchMaxAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    createdById: number | null
    status: $Enums.MatchStatus | null
    gameMode: string | null
    maxPlayers: number | null
    map: string | null
    isPrivate: boolean | null
    password: string | null
    balanceType: string | null
    isSimulation: boolean | null
    originalMatchId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    scheduledTime: Date | null
    winner: string | null
    blueScore: number | null
    redScore: number | null
    duration: number | null
  }

  export type MatchCountAggregateOutputType = {
    id: number
    title: number
    description: number
    createdById: number
    status: number
    gameMode: number
    maxPlayers: number
    map: number
    isPrivate: number
    password: number
    balanceType: number
    isSimulation: number
    originalMatchId: number
    replayData: number
    createdAt: number
    updatedAt: number
    scheduledTime: number
    winner: number
    blueScore: number
    redScore: number
    duration: number
    _all: number
  }


  export type MatchAvgAggregateInputType = {
    id?: true
    createdById?: true
    maxPlayers?: true
    blueScore?: true
    redScore?: true
    duration?: true
  }

  export type MatchSumAggregateInputType = {
    id?: true
    createdById?: true
    maxPlayers?: true
    blueScore?: true
    redScore?: true
    duration?: true
  }

  export type MatchMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    createdById?: true
    status?: true
    gameMode?: true
    maxPlayers?: true
    map?: true
    isPrivate?: true
    password?: true
    balanceType?: true
    isSimulation?: true
    originalMatchId?: true
    createdAt?: true
    updatedAt?: true
    scheduledTime?: true
    winner?: true
    blueScore?: true
    redScore?: true
    duration?: true
  }

  export type MatchMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    createdById?: true
    status?: true
    gameMode?: true
    maxPlayers?: true
    map?: true
    isPrivate?: true
    password?: true
    balanceType?: true
    isSimulation?: true
    originalMatchId?: true
    createdAt?: true
    updatedAt?: true
    scheduledTime?: true
    winner?: true
    blueScore?: true
    redScore?: true
    duration?: true
  }

  export type MatchCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    createdById?: true
    status?: true
    gameMode?: true
    maxPlayers?: true
    map?: true
    isPrivate?: true
    password?: true
    balanceType?: true
    isSimulation?: true
    originalMatchId?: true
    replayData?: true
    createdAt?: true
    updatedAt?: true
    scheduledTime?: true
    winner?: true
    blueScore?: true
    redScore?: true
    duration?: true
    _all?: true
  }

  export type MatchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Match to aggregate.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Matches
    **/
    _count?: true | MatchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MatchAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MatchSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MatchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MatchMaxAggregateInputType
  }

  export type GetMatchAggregateType<T extends MatchAggregateArgs> = {
        [P in keyof T & keyof AggregateMatch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMatch[P]>
      : GetScalarType<T[P], AggregateMatch[P]>
  }




  export type MatchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchWhereInput
    orderBy?: MatchOrderByWithAggregationInput | MatchOrderByWithAggregationInput[]
    by: MatchScalarFieldEnum[] | MatchScalarFieldEnum
    having?: MatchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MatchCountAggregateInputType | true
    _avg?: MatchAvgAggregateInputType
    _sum?: MatchSumAggregateInputType
    _min?: MatchMinAggregateInputType
    _max?: MatchMaxAggregateInputType
  }

  export type MatchGroupByOutputType = {
    id: number
    title: string
    description: string | null
    createdById: number
    status: $Enums.MatchStatus
    gameMode: string
    maxPlayers: number
    map: string | null
    isPrivate: boolean
    password: string | null
    balanceType: string
    isSimulation: boolean
    originalMatchId: string | null
    replayData: JsonValue | null
    createdAt: Date
    updatedAt: Date
    scheduledTime: Date
    winner: string | null
    blueScore: number
    redScore: number
    duration: number
    _count: MatchCountAggregateOutputType | null
    _avg: MatchAvgAggregateOutputType | null
    _sum: MatchSumAggregateOutputType | null
    _min: MatchMinAggregateOutputType | null
    _max: MatchMaxAggregateOutputType | null
  }

  type GetMatchGroupByPayload<T extends MatchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MatchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MatchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MatchGroupByOutputType[P]>
            : GetScalarType<T[P], MatchGroupByOutputType[P]>
        }
      >
    >


  export type MatchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    createdById?: boolean
    status?: boolean
    gameMode?: boolean
    maxPlayers?: boolean
    map?: boolean
    isPrivate?: boolean
    password?: boolean
    balanceType?: boolean
    isSimulation?: boolean
    originalMatchId?: boolean
    replayData?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    scheduledTime?: boolean
    winner?: boolean
    blueScore?: boolean
    redScore?: boolean
    duration?: boolean
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    players?: boolean | Match$playersArgs<ExtArgs>
    playerStats?: boolean | Match$playerStatsArgs<ExtArgs>
    mmrChanges?: boolean | Match$mmrChangesArgs<ExtArgs>
    eventLogs?: boolean | Match$eventLogsArgs<ExtArgs>
    _count?: boolean | MatchCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    createdById?: boolean
    status?: boolean
    gameMode?: boolean
    maxPlayers?: boolean
    map?: boolean
    isPrivate?: boolean
    password?: boolean
    balanceType?: boolean
    isSimulation?: boolean
    originalMatchId?: boolean
    replayData?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    scheduledTime?: boolean
    winner?: boolean
    blueScore?: boolean
    redScore?: boolean
    duration?: boolean
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    createdById?: boolean
    status?: boolean
    gameMode?: boolean
    maxPlayers?: boolean
    map?: boolean
    isPrivate?: boolean
    password?: boolean
    balanceType?: boolean
    isSimulation?: boolean
    originalMatchId?: boolean
    replayData?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    scheduledTime?: boolean
    winner?: boolean
    blueScore?: boolean
    redScore?: boolean
    duration?: boolean
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    createdById?: boolean
    status?: boolean
    gameMode?: boolean
    maxPlayers?: boolean
    map?: boolean
    isPrivate?: boolean
    password?: boolean
    balanceType?: boolean
    isSimulation?: boolean
    originalMatchId?: boolean
    replayData?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    scheduledTime?: boolean
    winner?: boolean
    blueScore?: boolean
    redScore?: boolean
    duration?: boolean
  }

  export type MatchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "createdById" | "status" | "gameMode" | "maxPlayers" | "map" | "isPrivate" | "password" | "balanceType" | "isSimulation" | "originalMatchId" | "replayData" | "createdAt" | "updatedAt" | "scheduledTime" | "winner" | "blueScore" | "redScore" | "duration", ExtArgs["result"]["match"]>
  export type MatchInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    players?: boolean | Match$playersArgs<ExtArgs>
    playerStats?: boolean | Match$playerStatsArgs<ExtArgs>
    mmrChanges?: boolean | Match$mmrChangesArgs<ExtArgs>
    eventLogs?: boolean | Match$eventLogsArgs<ExtArgs>
    _count?: boolean | MatchCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MatchIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MatchIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MatchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Match"
    objects: {
      createdBy: Prisma.$UserPayload<ExtArgs>
      players: Prisma.$MatchPlayerPayload<ExtArgs>[]
      playerStats: Prisma.$PlayerStatPayload<ExtArgs>[]
      mmrChanges: Prisma.$MmrChangePayload<ExtArgs>[]
      eventLogs: Prisma.$EventLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
      description: string | null
      createdById: number
      status: $Enums.MatchStatus
      gameMode: string
      maxPlayers: number
      map: string | null
      isPrivate: boolean
      password: string | null
      balanceType: string
      isSimulation: boolean
      originalMatchId: string | null
      replayData: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
      scheduledTime: Date
      winner: string | null
      blueScore: number
      redScore: number
      duration: number
    }, ExtArgs["result"]["match"]>
    composites: {}
  }

  type MatchGetPayload<S extends boolean | null | undefined | MatchDefaultArgs> = $Result.GetResult<Prisma.$MatchPayload, S>

  type MatchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MatchCountAggregateInputType | true
    }

  export interface MatchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Match'], meta: { name: 'Match' } }
    /**
     * Find zero or one Match that matches the filter.
     * @param {MatchFindUniqueArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MatchFindUniqueArgs>(args: SelectSubset<T, MatchFindUniqueArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Match that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MatchFindUniqueOrThrowArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MatchFindUniqueOrThrowArgs>(args: SelectSubset<T, MatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Match that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindFirstArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MatchFindFirstArgs>(args?: SelectSubset<T, MatchFindFirstArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Match that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindFirstOrThrowArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MatchFindFirstOrThrowArgs>(args?: SelectSubset<T, MatchFindFirstOrThrowArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Matches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Matches
     * const matches = await prisma.match.findMany()
     * 
     * // Get first 10 Matches
     * const matches = await prisma.match.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const matchWithIdOnly = await prisma.match.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MatchFindManyArgs>(args?: SelectSubset<T, MatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Match.
     * @param {MatchCreateArgs} args - Arguments to create a Match.
     * @example
     * // Create one Match
     * const Match = await prisma.match.create({
     *   data: {
     *     // ... data to create a Match
     *   }
     * })
     * 
     */
    create<T extends MatchCreateArgs>(args: SelectSubset<T, MatchCreateArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Matches.
     * @param {MatchCreateManyArgs} args - Arguments to create many Matches.
     * @example
     * // Create many Matches
     * const match = await prisma.match.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MatchCreateManyArgs>(args?: SelectSubset<T, MatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Matches and returns the data saved in the database.
     * @param {MatchCreateManyAndReturnArgs} args - Arguments to create many Matches.
     * @example
     * // Create many Matches
     * const match = await prisma.match.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Matches and only return the `id`
     * const matchWithIdOnly = await prisma.match.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MatchCreateManyAndReturnArgs>(args?: SelectSubset<T, MatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Match.
     * @param {MatchDeleteArgs} args - Arguments to delete one Match.
     * @example
     * // Delete one Match
     * const Match = await prisma.match.delete({
     *   where: {
     *     // ... filter to delete one Match
     *   }
     * })
     * 
     */
    delete<T extends MatchDeleteArgs>(args: SelectSubset<T, MatchDeleteArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Match.
     * @param {MatchUpdateArgs} args - Arguments to update one Match.
     * @example
     * // Update one Match
     * const match = await prisma.match.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MatchUpdateArgs>(args: SelectSubset<T, MatchUpdateArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Matches.
     * @param {MatchDeleteManyArgs} args - Arguments to filter Matches to delete.
     * @example
     * // Delete a few Matches
     * const { count } = await prisma.match.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MatchDeleteManyArgs>(args?: SelectSubset<T, MatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Matches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Matches
     * const match = await prisma.match.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MatchUpdateManyArgs>(args: SelectSubset<T, MatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Matches and returns the data updated in the database.
     * @param {MatchUpdateManyAndReturnArgs} args - Arguments to update many Matches.
     * @example
     * // Update many Matches
     * const match = await prisma.match.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Matches and only return the `id`
     * const matchWithIdOnly = await prisma.match.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MatchUpdateManyAndReturnArgs>(args: SelectSubset<T, MatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Match.
     * @param {MatchUpsertArgs} args - Arguments to update or create a Match.
     * @example
     * // Update or create a Match
     * const match = await prisma.match.upsert({
     *   create: {
     *     // ... data to create a Match
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Match we want to update
     *   }
     * })
     */
    upsert<T extends MatchUpsertArgs>(args: SelectSubset<T, MatchUpsertArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Matches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchCountArgs} args - Arguments to filter Matches to count.
     * @example
     * // Count the number of Matches
     * const count = await prisma.match.count({
     *   where: {
     *     // ... the filter for the Matches we want to count
     *   }
     * })
    **/
    count<T extends MatchCountArgs>(
      args?: Subset<T, MatchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MatchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Match.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MatchAggregateArgs>(args: Subset<T, MatchAggregateArgs>): Prisma.PrismaPromise<GetMatchAggregateType<T>>

    /**
     * Group by Match.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MatchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MatchGroupByArgs['orderBy'] }
        : { orderBy?: MatchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Match model
   */
  readonly fields: MatchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Match.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MatchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    createdBy<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    players<T extends Match$playersArgs<ExtArgs> = {}>(args?: Subset<T, Match$playersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    playerStats<T extends Match$playerStatsArgs<ExtArgs> = {}>(args?: Subset<T, Match$playerStatsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    mmrChanges<T extends Match$mmrChangesArgs<ExtArgs> = {}>(args?: Subset<T, Match$mmrChangesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    eventLogs<T extends Match$eventLogsArgs<ExtArgs> = {}>(args?: Subset<T, Match$eventLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Match model
   */
  interface MatchFieldRefs {
    readonly id: FieldRef<"Match", 'Int'>
    readonly title: FieldRef<"Match", 'String'>
    readonly description: FieldRef<"Match", 'String'>
    readonly createdById: FieldRef<"Match", 'Int'>
    readonly status: FieldRef<"Match", 'MatchStatus'>
    readonly gameMode: FieldRef<"Match", 'String'>
    readonly maxPlayers: FieldRef<"Match", 'Int'>
    readonly map: FieldRef<"Match", 'String'>
    readonly isPrivate: FieldRef<"Match", 'Boolean'>
    readonly password: FieldRef<"Match", 'String'>
    readonly balanceType: FieldRef<"Match", 'String'>
    readonly isSimulation: FieldRef<"Match", 'Boolean'>
    readonly originalMatchId: FieldRef<"Match", 'String'>
    readonly replayData: FieldRef<"Match", 'Json'>
    readonly createdAt: FieldRef<"Match", 'DateTime'>
    readonly updatedAt: FieldRef<"Match", 'DateTime'>
    readonly scheduledTime: FieldRef<"Match", 'DateTime'>
    readonly winner: FieldRef<"Match", 'String'>
    readonly blueScore: FieldRef<"Match", 'Int'>
    readonly redScore: FieldRef<"Match", 'Int'>
    readonly duration: FieldRef<"Match", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Match findUnique
   */
  export type MatchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match findUniqueOrThrow
   */
  export type MatchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match findFirst
   */
  export type MatchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Matches.
     */
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match findFirstOrThrow
   */
  export type MatchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Matches.
     */
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match findMany
   */
  export type MatchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Matches to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match create
   */
  export type MatchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The data needed to create a Match.
     */
    data: XOR<MatchCreateInput, MatchUncheckedCreateInput>
  }

  /**
   * Match createMany
   */
  export type MatchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Matches.
     */
    data: MatchCreateManyInput | MatchCreateManyInput[]
  }

  /**
   * Match createManyAndReturn
   */
  export type MatchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * The data used to create many Matches.
     */
    data: MatchCreateManyInput | MatchCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Match update
   */
  export type MatchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The data needed to update a Match.
     */
    data: XOR<MatchUpdateInput, MatchUncheckedUpdateInput>
    /**
     * Choose, which Match to update.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match updateMany
   */
  export type MatchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Matches.
     */
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyInput>
    /**
     * Filter which Matches to update
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to update.
     */
    limit?: number
  }

  /**
   * Match updateManyAndReturn
   */
  export type MatchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * The data used to update Matches.
     */
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyInput>
    /**
     * Filter which Matches to update
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Match upsert
   */
  export type MatchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The filter to search for the Match to update in case it exists.
     */
    where: MatchWhereUniqueInput
    /**
     * In case the Match found by the `where` argument doesn't exist, create a new Match with this data.
     */
    create: XOR<MatchCreateInput, MatchUncheckedCreateInput>
    /**
     * In case the Match was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MatchUpdateInput, MatchUncheckedUpdateInput>
  }

  /**
   * Match delete
   */
  export type MatchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter which Match to delete.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match deleteMany
   */
  export type MatchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Matches to delete
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to delete.
     */
    limit?: number
  }

  /**
   * Match.players
   */
  export type Match$playersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    where?: MatchPlayerWhereInput
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    cursor?: MatchPlayerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MatchPlayerScalarFieldEnum | MatchPlayerScalarFieldEnum[]
  }

  /**
   * Match.playerStats
   */
  export type Match$playerStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    where?: PlayerStatWhereInput
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    cursor?: PlayerStatWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PlayerStatScalarFieldEnum | PlayerStatScalarFieldEnum[]
  }

  /**
   * Match.mmrChanges
   */
  export type Match$mmrChangesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    where?: MmrChangeWhereInput
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    cursor?: MmrChangeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MmrChangeScalarFieldEnum | MmrChangeScalarFieldEnum[]
  }

  /**
   * Match.eventLogs
   */
  export type Match$eventLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    cursor?: EventLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * Match without action
   */
  export type MatchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
  }


  /**
   * Model MatchPlayer
   */

  export type AggregateMatchPlayer = {
    _count: MatchPlayerCountAggregateOutputType | null
    _avg: MatchPlayerAvgAggregateOutputType | null
    _sum: MatchPlayerSumAggregateOutputType | null
    _min: MatchPlayerMinAggregateOutputType | null
    _max: MatchPlayerMaxAggregateOutputType | null
  }

  export type MatchPlayerAvgAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
  }

  export type MatchPlayerSumAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
  }

  export type MatchPlayerMinAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    team: $Enums.Team | null
    role: string | null
    hero: string | null
    joinedAt: Date | null
  }

  export type MatchPlayerMaxAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    team: $Enums.Team | null
    role: string | null
    hero: string | null
    joinedAt: Date | null
  }

  export type MatchPlayerCountAggregateOutputType = {
    id: number
    matchId: number
    userId: number
    team: number
    role: number
    hero: number
    joinedAt: number
    _all: number
  }


  export type MatchPlayerAvgAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
  }

  export type MatchPlayerSumAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
  }

  export type MatchPlayerMinAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    team?: true
    role?: true
    hero?: true
    joinedAt?: true
  }

  export type MatchPlayerMaxAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    team?: true
    role?: true
    hero?: true
    joinedAt?: true
  }

  export type MatchPlayerCountAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    team?: true
    role?: true
    hero?: true
    joinedAt?: true
    _all?: true
  }

  export type MatchPlayerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MatchPlayer to aggregate.
     */
    where?: MatchPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchPlayers to fetch.
     */
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MatchPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MatchPlayers
    **/
    _count?: true | MatchPlayerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MatchPlayerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MatchPlayerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MatchPlayerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MatchPlayerMaxAggregateInputType
  }

  export type GetMatchPlayerAggregateType<T extends MatchPlayerAggregateArgs> = {
        [P in keyof T & keyof AggregateMatchPlayer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMatchPlayer[P]>
      : GetScalarType<T[P], AggregateMatchPlayer[P]>
  }




  export type MatchPlayerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchPlayerWhereInput
    orderBy?: MatchPlayerOrderByWithAggregationInput | MatchPlayerOrderByWithAggregationInput[]
    by: MatchPlayerScalarFieldEnum[] | MatchPlayerScalarFieldEnum
    having?: MatchPlayerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MatchPlayerCountAggregateInputType | true
    _avg?: MatchPlayerAvgAggregateInputType
    _sum?: MatchPlayerSumAggregateInputType
    _min?: MatchPlayerMinAggregateInputType
    _max?: MatchPlayerMaxAggregateInputType
  }

  export type MatchPlayerGroupByOutputType = {
    id: number
    matchId: number
    userId: number
    team: $Enums.Team
    role: string | null
    hero: string | null
    joinedAt: Date
    _count: MatchPlayerCountAggregateOutputType | null
    _avg: MatchPlayerAvgAggregateOutputType | null
    _sum: MatchPlayerSumAggregateOutputType | null
    _min: MatchPlayerMinAggregateOutputType | null
    _max: MatchPlayerMaxAggregateOutputType | null
  }

  type GetMatchPlayerGroupByPayload<T extends MatchPlayerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MatchPlayerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MatchPlayerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MatchPlayerGroupByOutputType[P]>
            : GetScalarType<T[P], MatchPlayerGroupByOutputType[P]>
        }
      >
    >


  export type MatchPlayerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    team?: boolean
    role?: boolean
    hero?: boolean
    joinedAt?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchPlayer"]>

  export type MatchPlayerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    team?: boolean
    role?: boolean
    hero?: boolean
    joinedAt?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchPlayer"]>

  export type MatchPlayerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    team?: boolean
    role?: boolean
    hero?: boolean
    joinedAt?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchPlayer"]>

  export type MatchPlayerSelectScalar = {
    id?: boolean
    matchId?: boolean
    userId?: boolean
    team?: boolean
    role?: boolean
    hero?: boolean
    joinedAt?: boolean
  }

  export type MatchPlayerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchId" | "userId" | "team" | "role" | "hero" | "joinedAt", ExtArgs["result"]["matchPlayer"]>
  export type MatchPlayerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MatchPlayerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MatchPlayerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MatchPlayerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MatchPlayer"
    objects: {
      match: Prisma.$MatchPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      matchId: number
      userId: number
      team: $Enums.Team
      role: string | null
      hero: string | null
      joinedAt: Date
    }, ExtArgs["result"]["matchPlayer"]>
    composites: {}
  }

  type MatchPlayerGetPayload<S extends boolean | null | undefined | MatchPlayerDefaultArgs> = $Result.GetResult<Prisma.$MatchPlayerPayload, S>

  type MatchPlayerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MatchPlayerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MatchPlayerCountAggregateInputType | true
    }

  export interface MatchPlayerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MatchPlayer'], meta: { name: 'MatchPlayer' } }
    /**
     * Find zero or one MatchPlayer that matches the filter.
     * @param {MatchPlayerFindUniqueArgs} args - Arguments to find a MatchPlayer
     * @example
     * // Get one MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MatchPlayerFindUniqueArgs>(args: SelectSubset<T, MatchPlayerFindUniqueArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MatchPlayer that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MatchPlayerFindUniqueOrThrowArgs} args - Arguments to find a MatchPlayer
     * @example
     * // Get one MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MatchPlayerFindUniqueOrThrowArgs>(args: SelectSubset<T, MatchPlayerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MatchPlayer that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerFindFirstArgs} args - Arguments to find a MatchPlayer
     * @example
     * // Get one MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MatchPlayerFindFirstArgs>(args?: SelectSubset<T, MatchPlayerFindFirstArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MatchPlayer that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerFindFirstOrThrowArgs} args - Arguments to find a MatchPlayer
     * @example
     * // Get one MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MatchPlayerFindFirstOrThrowArgs>(args?: SelectSubset<T, MatchPlayerFindFirstOrThrowArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MatchPlayers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MatchPlayers
     * const matchPlayers = await prisma.matchPlayer.findMany()
     * 
     * // Get first 10 MatchPlayers
     * const matchPlayers = await prisma.matchPlayer.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const matchPlayerWithIdOnly = await prisma.matchPlayer.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MatchPlayerFindManyArgs>(args?: SelectSubset<T, MatchPlayerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MatchPlayer.
     * @param {MatchPlayerCreateArgs} args - Arguments to create a MatchPlayer.
     * @example
     * // Create one MatchPlayer
     * const MatchPlayer = await prisma.matchPlayer.create({
     *   data: {
     *     // ... data to create a MatchPlayer
     *   }
     * })
     * 
     */
    create<T extends MatchPlayerCreateArgs>(args: SelectSubset<T, MatchPlayerCreateArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MatchPlayers.
     * @param {MatchPlayerCreateManyArgs} args - Arguments to create many MatchPlayers.
     * @example
     * // Create many MatchPlayers
     * const matchPlayer = await prisma.matchPlayer.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MatchPlayerCreateManyArgs>(args?: SelectSubset<T, MatchPlayerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MatchPlayers and returns the data saved in the database.
     * @param {MatchPlayerCreateManyAndReturnArgs} args - Arguments to create many MatchPlayers.
     * @example
     * // Create many MatchPlayers
     * const matchPlayer = await prisma.matchPlayer.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MatchPlayers and only return the `id`
     * const matchPlayerWithIdOnly = await prisma.matchPlayer.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MatchPlayerCreateManyAndReturnArgs>(args?: SelectSubset<T, MatchPlayerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MatchPlayer.
     * @param {MatchPlayerDeleteArgs} args - Arguments to delete one MatchPlayer.
     * @example
     * // Delete one MatchPlayer
     * const MatchPlayer = await prisma.matchPlayer.delete({
     *   where: {
     *     // ... filter to delete one MatchPlayer
     *   }
     * })
     * 
     */
    delete<T extends MatchPlayerDeleteArgs>(args: SelectSubset<T, MatchPlayerDeleteArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MatchPlayer.
     * @param {MatchPlayerUpdateArgs} args - Arguments to update one MatchPlayer.
     * @example
     * // Update one MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MatchPlayerUpdateArgs>(args: SelectSubset<T, MatchPlayerUpdateArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MatchPlayers.
     * @param {MatchPlayerDeleteManyArgs} args - Arguments to filter MatchPlayers to delete.
     * @example
     * // Delete a few MatchPlayers
     * const { count } = await prisma.matchPlayer.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MatchPlayerDeleteManyArgs>(args?: SelectSubset<T, MatchPlayerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MatchPlayers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MatchPlayers
     * const matchPlayer = await prisma.matchPlayer.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MatchPlayerUpdateManyArgs>(args: SelectSubset<T, MatchPlayerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MatchPlayers and returns the data updated in the database.
     * @param {MatchPlayerUpdateManyAndReturnArgs} args - Arguments to update many MatchPlayers.
     * @example
     * // Update many MatchPlayers
     * const matchPlayer = await prisma.matchPlayer.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MatchPlayers and only return the `id`
     * const matchPlayerWithIdOnly = await prisma.matchPlayer.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MatchPlayerUpdateManyAndReturnArgs>(args: SelectSubset<T, MatchPlayerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MatchPlayer.
     * @param {MatchPlayerUpsertArgs} args - Arguments to update or create a MatchPlayer.
     * @example
     * // Update or create a MatchPlayer
     * const matchPlayer = await prisma.matchPlayer.upsert({
     *   create: {
     *     // ... data to create a MatchPlayer
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MatchPlayer we want to update
     *   }
     * })
     */
    upsert<T extends MatchPlayerUpsertArgs>(args: SelectSubset<T, MatchPlayerUpsertArgs<ExtArgs>>): Prisma__MatchPlayerClient<$Result.GetResult<Prisma.$MatchPlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MatchPlayers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerCountArgs} args - Arguments to filter MatchPlayers to count.
     * @example
     * // Count the number of MatchPlayers
     * const count = await prisma.matchPlayer.count({
     *   where: {
     *     // ... the filter for the MatchPlayers we want to count
     *   }
     * })
    **/
    count<T extends MatchPlayerCountArgs>(
      args?: Subset<T, MatchPlayerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MatchPlayerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MatchPlayer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MatchPlayerAggregateArgs>(args: Subset<T, MatchPlayerAggregateArgs>): Prisma.PrismaPromise<GetMatchPlayerAggregateType<T>>

    /**
     * Group by MatchPlayer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchPlayerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MatchPlayerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MatchPlayerGroupByArgs['orderBy'] }
        : { orderBy?: MatchPlayerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MatchPlayerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMatchPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MatchPlayer model
   */
  readonly fields: MatchPlayerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MatchPlayer.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MatchPlayerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    match<T extends MatchDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MatchDefaultArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MatchPlayer model
   */
  interface MatchPlayerFieldRefs {
    readonly id: FieldRef<"MatchPlayer", 'Int'>
    readonly matchId: FieldRef<"MatchPlayer", 'Int'>
    readonly userId: FieldRef<"MatchPlayer", 'Int'>
    readonly team: FieldRef<"MatchPlayer", 'Team'>
    readonly role: FieldRef<"MatchPlayer", 'String'>
    readonly hero: FieldRef<"MatchPlayer", 'String'>
    readonly joinedAt: FieldRef<"MatchPlayer", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MatchPlayer findUnique
   */
  export type MatchPlayerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter, which MatchPlayer to fetch.
     */
    where: MatchPlayerWhereUniqueInput
  }

  /**
   * MatchPlayer findUniqueOrThrow
   */
  export type MatchPlayerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter, which MatchPlayer to fetch.
     */
    where: MatchPlayerWhereUniqueInput
  }

  /**
   * MatchPlayer findFirst
   */
  export type MatchPlayerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter, which MatchPlayer to fetch.
     */
    where?: MatchPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchPlayers to fetch.
     */
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MatchPlayers.
     */
    cursor?: MatchPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MatchPlayers.
     */
    distinct?: MatchPlayerScalarFieldEnum | MatchPlayerScalarFieldEnum[]
  }

  /**
   * MatchPlayer findFirstOrThrow
   */
  export type MatchPlayerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter, which MatchPlayer to fetch.
     */
    where?: MatchPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchPlayers to fetch.
     */
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MatchPlayers.
     */
    cursor?: MatchPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MatchPlayers.
     */
    distinct?: MatchPlayerScalarFieldEnum | MatchPlayerScalarFieldEnum[]
  }

  /**
   * MatchPlayer findMany
   */
  export type MatchPlayerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter, which MatchPlayers to fetch.
     */
    where?: MatchPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchPlayers to fetch.
     */
    orderBy?: MatchPlayerOrderByWithRelationInput | MatchPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MatchPlayers.
     */
    cursor?: MatchPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchPlayers.
     */
    skip?: number
    distinct?: MatchPlayerScalarFieldEnum | MatchPlayerScalarFieldEnum[]
  }

  /**
   * MatchPlayer create
   */
  export type MatchPlayerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * The data needed to create a MatchPlayer.
     */
    data: XOR<MatchPlayerCreateInput, MatchPlayerUncheckedCreateInput>
  }

  /**
   * MatchPlayer createMany
   */
  export type MatchPlayerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MatchPlayers.
     */
    data: MatchPlayerCreateManyInput | MatchPlayerCreateManyInput[]
  }

  /**
   * MatchPlayer createManyAndReturn
   */
  export type MatchPlayerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * The data used to create many MatchPlayers.
     */
    data: MatchPlayerCreateManyInput | MatchPlayerCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MatchPlayer update
   */
  export type MatchPlayerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * The data needed to update a MatchPlayer.
     */
    data: XOR<MatchPlayerUpdateInput, MatchPlayerUncheckedUpdateInput>
    /**
     * Choose, which MatchPlayer to update.
     */
    where: MatchPlayerWhereUniqueInput
  }

  /**
   * MatchPlayer updateMany
   */
  export type MatchPlayerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MatchPlayers.
     */
    data: XOR<MatchPlayerUpdateManyMutationInput, MatchPlayerUncheckedUpdateManyInput>
    /**
     * Filter which MatchPlayers to update
     */
    where?: MatchPlayerWhereInput
    /**
     * Limit how many MatchPlayers to update.
     */
    limit?: number
  }

  /**
   * MatchPlayer updateManyAndReturn
   */
  export type MatchPlayerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * The data used to update MatchPlayers.
     */
    data: XOR<MatchPlayerUpdateManyMutationInput, MatchPlayerUncheckedUpdateManyInput>
    /**
     * Filter which MatchPlayers to update
     */
    where?: MatchPlayerWhereInput
    /**
     * Limit how many MatchPlayers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MatchPlayer upsert
   */
  export type MatchPlayerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * The filter to search for the MatchPlayer to update in case it exists.
     */
    where: MatchPlayerWhereUniqueInput
    /**
     * In case the MatchPlayer found by the `where` argument doesn't exist, create a new MatchPlayer with this data.
     */
    create: XOR<MatchPlayerCreateInput, MatchPlayerUncheckedCreateInput>
    /**
     * In case the MatchPlayer was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MatchPlayerUpdateInput, MatchPlayerUncheckedUpdateInput>
  }

  /**
   * MatchPlayer delete
   */
  export type MatchPlayerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
    /**
     * Filter which MatchPlayer to delete.
     */
    where: MatchPlayerWhereUniqueInput
  }

  /**
   * MatchPlayer deleteMany
   */
  export type MatchPlayerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MatchPlayers to delete
     */
    where?: MatchPlayerWhereInput
    /**
     * Limit how many MatchPlayers to delete.
     */
    limit?: number
  }

  /**
   * MatchPlayer without action
   */
  export type MatchPlayerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchPlayer
     */
    select?: MatchPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchPlayer
     */
    omit?: MatchPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchPlayerInclude<ExtArgs> | null
  }


  /**
   * Model PlayerStat
   */

  export type AggregatePlayerStat = {
    _count: PlayerStatCountAggregateOutputType | null
    _avg: PlayerStatAvgAggregateOutputType | null
    _sum: PlayerStatSumAggregateOutputType | null
    _min: PlayerStatMinAggregateOutputType | null
    _max: PlayerStatMaxAggregateOutputType | null
  }

  export type PlayerStatAvgAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    kills: number | null
    deaths: number | null
    assists: number | null
    heroDamage: number | null
    siegeDamage: number | null
    healing: number | null
    experienceContribution: number | null
    mmrBefore: number | null
    mmrAfter: number | null
    mmrChange: number | null
  }

  export type PlayerStatSumAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    kills: number | null
    deaths: number | null
    assists: number | null
    heroDamage: number | null
    siegeDamage: number | null
    healing: number | null
    experienceContribution: number | null
    mmrBefore: number | null
    mmrAfter: number | null
    mmrChange: number | null
  }

  export type PlayerStatMinAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    userIdString: string | null
    battletag: string | null
    team: $Enums.Team | null
    hero: string | null
    kills: number | null
    deaths: number | null
    assists: number | null
    heroDamage: number | null
    siegeDamage: number | null
    healing: number | null
    experienceContribution: number | null
    mmrBefore: number | null
    mmrAfter: number | null
    mmrChange: number | null
  }

  export type PlayerStatMaxAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    userIdString: string | null
    battletag: string | null
    team: $Enums.Team | null
    hero: string | null
    kills: number | null
    deaths: number | null
    assists: number | null
    heroDamage: number | null
    siegeDamage: number | null
    healing: number | null
    experienceContribution: number | null
    mmrBefore: number | null
    mmrAfter: number | null
    mmrChange: number | null
  }

  export type PlayerStatCountAggregateOutputType = {
    id: number
    matchId: number
    userId: number
    userIdString: number
    battletag: number
    team: number
    hero: number
    kills: number
    deaths: number
    assists: number
    heroDamage: number
    siegeDamage: number
    healing: number
    experienceContribution: number
    mmrBefore: number
    mmrAfter: number
    mmrChange: number
    _all: number
  }


  export type PlayerStatAvgAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    kills?: true
    deaths?: true
    assists?: true
    heroDamage?: true
    siegeDamage?: true
    healing?: true
    experienceContribution?: true
    mmrBefore?: true
    mmrAfter?: true
    mmrChange?: true
  }

  export type PlayerStatSumAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    kills?: true
    deaths?: true
    assists?: true
    heroDamage?: true
    siegeDamage?: true
    healing?: true
    experienceContribution?: true
    mmrBefore?: true
    mmrAfter?: true
    mmrChange?: true
  }

  export type PlayerStatMinAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    userIdString?: true
    battletag?: true
    team?: true
    hero?: true
    kills?: true
    deaths?: true
    assists?: true
    heroDamage?: true
    siegeDamage?: true
    healing?: true
    experienceContribution?: true
    mmrBefore?: true
    mmrAfter?: true
    mmrChange?: true
  }

  export type PlayerStatMaxAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    userIdString?: true
    battletag?: true
    team?: true
    hero?: true
    kills?: true
    deaths?: true
    assists?: true
    heroDamage?: true
    siegeDamage?: true
    healing?: true
    experienceContribution?: true
    mmrBefore?: true
    mmrAfter?: true
    mmrChange?: true
  }

  export type PlayerStatCountAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    userIdString?: true
    battletag?: true
    team?: true
    hero?: true
    kills?: true
    deaths?: true
    assists?: true
    heroDamage?: true
    siegeDamage?: true
    healing?: true
    experienceContribution?: true
    mmrBefore?: true
    mmrAfter?: true
    mmrChange?: true
    _all?: true
  }

  export type PlayerStatAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayerStat to aggregate.
     */
    where?: PlayerStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PlayerStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PlayerStats
    **/
    _count?: true | PlayerStatCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PlayerStatAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PlayerStatSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PlayerStatMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PlayerStatMaxAggregateInputType
  }

  export type GetPlayerStatAggregateType<T extends PlayerStatAggregateArgs> = {
        [P in keyof T & keyof AggregatePlayerStat]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayerStat[P]>
      : GetScalarType<T[P], AggregatePlayerStat[P]>
  }




  export type PlayerStatGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerStatWhereInput
    orderBy?: PlayerStatOrderByWithAggregationInput | PlayerStatOrderByWithAggregationInput[]
    by: PlayerStatScalarFieldEnum[] | PlayerStatScalarFieldEnum
    having?: PlayerStatScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PlayerStatCountAggregateInputType | true
    _avg?: PlayerStatAvgAggregateInputType
    _sum?: PlayerStatSumAggregateInputType
    _min?: PlayerStatMinAggregateInputType
    _max?: PlayerStatMaxAggregateInputType
  }

  export type PlayerStatGroupByOutputType = {
    id: number
    matchId: number
    userId: number | null
    userIdString: string | null
    battletag: string
    team: $Enums.Team
    hero: string | null
    kills: number | null
    deaths: number | null
    assists: number | null
    heroDamage: number | null
    siegeDamage: number | null
    healing: number | null
    experienceContribution: number | null
    mmrBefore: number | null
    mmrAfter: number | null
    mmrChange: number | null
    _count: PlayerStatCountAggregateOutputType | null
    _avg: PlayerStatAvgAggregateOutputType | null
    _sum: PlayerStatSumAggregateOutputType | null
    _min: PlayerStatMinAggregateOutputType | null
    _max: PlayerStatMaxAggregateOutputType | null
  }

  type GetPlayerStatGroupByPayload<T extends PlayerStatGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayerStatGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PlayerStatGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PlayerStatGroupByOutputType[P]>
            : GetScalarType<T[P], PlayerStatGroupByOutputType[P]>
        }
      >
    >


  export type PlayerStatSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    userIdString?: boolean
    battletag?: boolean
    team?: boolean
    hero?: boolean
    kills?: boolean
    deaths?: boolean
    assists?: boolean
    heroDamage?: boolean
    siegeDamage?: boolean
    healing?: boolean
    experienceContribution?: boolean
    mmrBefore?: boolean
    mmrAfter?: boolean
    mmrChange?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }, ExtArgs["result"]["playerStat"]>

  export type PlayerStatSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    userIdString?: boolean
    battletag?: boolean
    team?: boolean
    hero?: boolean
    kills?: boolean
    deaths?: boolean
    assists?: boolean
    heroDamage?: boolean
    siegeDamage?: boolean
    healing?: boolean
    experienceContribution?: boolean
    mmrBefore?: boolean
    mmrAfter?: boolean
    mmrChange?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }, ExtArgs["result"]["playerStat"]>

  export type PlayerStatSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    userIdString?: boolean
    battletag?: boolean
    team?: boolean
    hero?: boolean
    kills?: boolean
    deaths?: boolean
    assists?: boolean
    heroDamage?: boolean
    siegeDamage?: boolean
    healing?: boolean
    experienceContribution?: boolean
    mmrBefore?: boolean
    mmrAfter?: boolean
    mmrChange?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }, ExtArgs["result"]["playerStat"]>

  export type PlayerStatSelectScalar = {
    id?: boolean
    matchId?: boolean
    userId?: boolean
    userIdString?: boolean
    battletag?: boolean
    team?: boolean
    hero?: boolean
    kills?: boolean
    deaths?: boolean
    assists?: boolean
    heroDamage?: boolean
    siegeDamage?: boolean
    healing?: boolean
    experienceContribution?: boolean
    mmrBefore?: boolean
    mmrAfter?: boolean
    mmrChange?: boolean
  }

  export type PlayerStatOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchId" | "userId" | "userIdString" | "battletag" | "team" | "hero" | "kills" | "deaths" | "assists" | "heroDamage" | "siegeDamage" | "healing" | "experienceContribution" | "mmrBefore" | "mmrAfter" | "mmrChange", ExtArgs["result"]["playerStat"]>
  export type PlayerStatInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }
  export type PlayerStatIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }
  export type PlayerStatIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | PlayerStat$userArgs<ExtArgs>
  }

  export type $PlayerStatPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PlayerStat"
    objects: {
      match: Prisma.$MatchPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      matchId: number
      userId: number | null
      userIdString: string | null
      battletag: string
      team: $Enums.Team
      hero: string | null
      kills: number | null
      deaths: number | null
      assists: number | null
      heroDamage: number | null
      siegeDamage: number | null
      healing: number | null
      experienceContribution: number | null
      mmrBefore: number | null
      mmrAfter: number | null
      mmrChange: number | null
    }, ExtArgs["result"]["playerStat"]>
    composites: {}
  }

  type PlayerStatGetPayload<S extends boolean | null | undefined | PlayerStatDefaultArgs> = $Result.GetResult<Prisma.$PlayerStatPayload, S>

  type PlayerStatCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PlayerStatFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PlayerStatCountAggregateInputType | true
    }

  export interface PlayerStatDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PlayerStat'], meta: { name: 'PlayerStat' } }
    /**
     * Find zero or one PlayerStat that matches the filter.
     * @param {PlayerStatFindUniqueArgs} args - Arguments to find a PlayerStat
     * @example
     * // Get one PlayerStat
     * const playerStat = await prisma.playerStat.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayerStatFindUniqueArgs>(args: SelectSubset<T, PlayerStatFindUniqueArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PlayerStat that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayerStatFindUniqueOrThrowArgs} args - Arguments to find a PlayerStat
     * @example
     * // Get one PlayerStat
     * const playerStat = await prisma.playerStat.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayerStatFindUniqueOrThrowArgs>(args: SelectSubset<T, PlayerStatFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PlayerStat that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatFindFirstArgs} args - Arguments to find a PlayerStat
     * @example
     * // Get one PlayerStat
     * const playerStat = await prisma.playerStat.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayerStatFindFirstArgs>(args?: SelectSubset<T, PlayerStatFindFirstArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PlayerStat that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatFindFirstOrThrowArgs} args - Arguments to find a PlayerStat
     * @example
     * // Get one PlayerStat
     * const playerStat = await prisma.playerStat.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayerStatFindFirstOrThrowArgs>(args?: SelectSubset<T, PlayerStatFindFirstOrThrowArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PlayerStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PlayerStats
     * const playerStats = await prisma.playerStat.findMany()
     * 
     * // Get first 10 PlayerStats
     * const playerStats = await prisma.playerStat.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const playerStatWithIdOnly = await prisma.playerStat.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PlayerStatFindManyArgs>(args?: SelectSubset<T, PlayerStatFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PlayerStat.
     * @param {PlayerStatCreateArgs} args - Arguments to create a PlayerStat.
     * @example
     * // Create one PlayerStat
     * const PlayerStat = await prisma.playerStat.create({
     *   data: {
     *     // ... data to create a PlayerStat
     *   }
     * })
     * 
     */
    create<T extends PlayerStatCreateArgs>(args: SelectSubset<T, PlayerStatCreateArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PlayerStats.
     * @param {PlayerStatCreateManyArgs} args - Arguments to create many PlayerStats.
     * @example
     * // Create many PlayerStats
     * const playerStat = await prisma.playerStat.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PlayerStatCreateManyArgs>(args?: SelectSubset<T, PlayerStatCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PlayerStats and returns the data saved in the database.
     * @param {PlayerStatCreateManyAndReturnArgs} args - Arguments to create many PlayerStats.
     * @example
     * // Create many PlayerStats
     * const playerStat = await prisma.playerStat.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PlayerStats and only return the `id`
     * const playerStatWithIdOnly = await prisma.playerStat.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PlayerStatCreateManyAndReturnArgs>(args?: SelectSubset<T, PlayerStatCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PlayerStat.
     * @param {PlayerStatDeleteArgs} args - Arguments to delete one PlayerStat.
     * @example
     * // Delete one PlayerStat
     * const PlayerStat = await prisma.playerStat.delete({
     *   where: {
     *     // ... filter to delete one PlayerStat
     *   }
     * })
     * 
     */
    delete<T extends PlayerStatDeleteArgs>(args: SelectSubset<T, PlayerStatDeleteArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PlayerStat.
     * @param {PlayerStatUpdateArgs} args - Arguments to update one PlayerStat.
     * @example
     * // Update one PlayerStat
     * const playerStat = await prisma.playerStat.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PlayerStatUpdateArgs>(args: SelectSubset<T, PlayerStatUpdateArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PlayerStats.
     * @param {PlayerStatDeleteManyArgs} args - Arguments to filter PlayerStats to delete.
     * @example
     * // Delete a few PlayerStats
     * const { count } = await prisma.playerStat.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PlayerStatDeleteManyArgs>(args?: SelectSubset<T, PlayerStatDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PlayerStats
     * const playerStat = await prisma.playerStat.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PlayerStatUpdateManyArgs>(args: SelectSubset<T, PlayerStatUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PlayerStats and returns the data updated in the database.
     * @param {PlayerStatUpdateManyAndReturnArgs} args - Arguments to update many PlayerStats.
     * @example
     * // Update many PlayerStats
     * const playerStat = await prisma.playerStat.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PlayerStats and only return the `id`
     * const playerStatWithIdOnly = await prisma.playerStat.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PlayerStatUpdateManyAndReturnArgs>(args: SelectSubset<T, PlayerStatUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PlayerStat.
     * @param {PlayerStatUpsertArgs} args - Arguments to update or create a PlayerStat.
     * @example
     * // Update or create a PlayerStat
     * const playerStat = await prisma.playerStat.upsert({
     *   create: {
     *     // ... data to create a PlayerStat
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PlayerStat we want to update
     *   }
     * })
     */
    upsert<T extends PlayerStatUpsertArgs>(args: SelectSubset<T, PlayerStatUpsertArgs<ExtArgs>>): Prisma__PlayerStatClient<$Result.GetResult<Prisma.$PlayerStatPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatCountArgs} args - Arguments to filter PlayerStats to count.
     * @example
     * // Count the number of PlayerStats
     * const count = await prisma.playerStat.count({
     *   where: {
     *     // ... the filter for the PlayerStats we want to count
     *   }
     * })
    **/
    count<T extends PlayerStatCountArgs>(
      args?: Subset<T, PlayerStatCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlayerStatCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PlayerStat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PlayerStatAggregateArgs>(args: Subset<T, PlayerStatAggregateArgs>): Prisma.PrismaPromise<GetPlayerStatAggregateType<T>>

    /**
     * Group by PlayerStat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PlayerStatGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayerStatGroupByArgs['orderBy'] }
        : { orderBy?: PlayerStatGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PlayerStatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlayerStatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PlayerStat model
   */
  readonly fields: PlayerStatFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PlayerStat.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayerStatClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    match<T extends MatchDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MatchDefaultArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends PlayerStat$userArgs<ExtArgs> = {}>(args?: Subset<T, PlayerStat$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PlayerStat model
   */
  interface PlayerStatFieldRefs {
    readonly id: FieldRef<"PlayerStat", 'Int'>
    readonly matchId: FieldRef<"PlayerStat", 'Int'>
    readonly userId: FieldRef<"PlayerStat", 'Int'>
    readonly userIdString: FieldRef<"PlayerStat", 'String'>
    readonly battletag: FieldRef<"PlayerStat", 'String'>
    readonly team: FieldRef<"PlayerStat", 'Team'>
    readonly hero: FieldRef<"PlayerStat", 'String'>
    readonly kills: FieldRef<"PlayerStat", 'Int'>
    readonly deaths: FieldRef<"PlayerStat", 'Int'>
    readonly assists: FieldRef<"PlayerStat", 'Int'>
    readonly heroDamage: FieldRef<"PlayerStat", 'Int'>
    readonly siegeDamage: FieldRef<"PlayerStat", 'Int'>
    readonly healing: FieldRef<"PlayerStat", 'Int'>
    readonly experienceContribution: FieldRef<"PlayerStat", 'Int'>
    readonly mmrBefore: FieldRef<"PlayerStat", 'Int'>
    readonly mmrAfter: FieldRef<"PlayerStat", 'Int'>
    readonly mmrChange: FieldRef<"PlayerStat", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * PlayerStat findUnique
   */
  export type PlayerStatFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStat to fetch.
     */
    where: PlayerStatWhereUniqueInput
  }

  /**
   * PlayerStat findUniqueOrThrow
   */
  export type PlayerStatFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStat to fetch.
     */
    where: PlayerStatWhereUniqueInput
  }

  /**
   * PlayerStat findFirst
   */
  export type PlayerStatFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStat to fetch.
     */
    where?: PlayerStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PlayerStats.
     */
    cursor?: PlayerStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PlayerStats.
     */
    distinct?: PlayerStatScalarFieldEnum | PlayerStatScalarFieldEnum[]
  }

  /**
   * PlayerStat findFirstOrThrow
   */
  export type PlayerStatFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStat to fetch.
     */
    where?: PlayerStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PlayerStats.
     */
    cursor?: PlayerStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PlayerStats.
     */
    distinct?: PlayerStatScalarFieldEnum | PlayerStatScalarFieldEnum[]
  }

  /**
   * PlayerStat findMany
   */
  export type PlayerStatFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where?: PlayerStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatOrderByWithRelationInput | PlayerStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PlayerStats.
     */
    cursor?: PlayerStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    distinct?: PlayerStatScalarFieldEnum | PlayerStatScalarFieldEnum[]
  }

  /**
   * PlayerStat create
   */
  export type PlayerStatCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * The data needed to create a PlayerStat.
     */
    data: XOR<PlayerStatCreateInput, PlayerStatUncheckedCreateInput>
  }

  /**
   * PlayerStat createMany
   */
  export type PlayerStatCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PlayerStats.
     */
    data: PlayerStatCreateManyInput | PlayerStatCreateManyInput[]
  }

  /**
   * PlayerStat createManyAndReturn
   */
  export type PlayerStatCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * The data used to create many PlayerStats.
     */
    data: PlayerStatCreateManyInput | PlayerStatCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PlayerStat update
   */
  export type PlayerStatUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * The data needed to update a PlayerStat.
     */
    data: XOR<PlayerStatUpdateInput, PlayerStatUncheckedUpdateInput>
    /**
     * Choose, which PlayerStat to update.
     */
    where: PlayerStatWhereUniqueInput
  }

  /**
   * PlayerStat updateMany
   */
  export type PlayerStatUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PlayerStats.
     */
    data: XOR<PlayerStatUpdateManyMutationInput, PlayerStatUncheckedUpdateManyInput>
    /**
     * Filter which PlayerStats to update
     */
    where?: PlayerStatWhereInput
    /**
     * Limit how many PlayerStats to update.
     */
    limit?: number
  }

  /**
   * PlayerStat updateManyAndReturn
   */
  export type PlayerStatUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * The data used to update PlayerStats.
     */
    data: XOR<PlayerStatUpdateManyMutationInput, PlayerStatUncheckedUpdateManyInput>
    /**
     * Filter which PlayerStats to update
     */
    where?: PlayerStatWhereInput
    /**
     * Limit how many PlayerStats to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PlayerStat upsert
   */
  export type PlayerStatUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * The filter to search for the PlayerStat to update in case it exists.
     */
    where: PlayerStatWhereUniqueInput
    /**
     * In case the PlayerStat found by the `where` argument doesn't exist, create a new PlayerStat with this data.
     */
    create: XOR<PlayerStatCreateInput, PlayerStatUncheckedCreateInput>
    /**
     * In case the PlayerStat was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayerStatUpdateInput, PlayerStatUncheckedUpdateInput>
  }

  /**
   * PlayerStat delete
   */
  export type PlayerStatDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
    /**
     * Filter which PlayerStat to delete.
     */
    where: PlayerStatWhereUniqueInput
  }

  /**
   * PlayerStat deleteMany
   */
  export type PlayerStatDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayerStats to delete
     */
    where?: PlayerStatWhereInput
    /**
     * Limit how many PlayerStats to delete.
     */
    limit?: number
  }

  /**
   * PlayerStat.user
   */
  export type PlayerStat$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * PlayerStat without action
   */
  export type PlayerStatDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStat
     */
    select?: PlayerStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStat
     */
    omit?: PlayerStatOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatInclude<ExtArgs> | null
  }


  /**
   * Model MmrChange
   */

  export type AggregateMmrChange = {
    _count: MmrChangeCountAggregateOutputType | null
    _avg: MmrChangeAvgAggregateOutputType | null
    _sum: MmrChangeSumAggregateOutputType | null
    _min: MmrChangeMinAggregateOutputType | null
    _max: MmrChangeMaxAggregateOutputType | null
  }

  export type MmrChangeAvgAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    before: number | null
    after: number | null
    change: number | null
  }

  export type MmrChangeSumAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    before: number | null
    after: number | null
    change: number | null
  }

  export type MmrChangeMinAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    before: number | null
    after: number | null
    change: number | null
  }

  export type MmrChangeMaxAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    before: number | null
    after: number | null
    change: number | null
  }

  export type MmrChangeCountAggregateOutputType = {
    id: number
    matchId: number
    userId: number
    before: number
    after: number
    change: number
    _all: number
  }


  export type MmrChangeAvgAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    before?: true
    after?: true
    change?: true
  }

  export type MmrChangeSumAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    before?: true
    after?: true
    change?: true
  }

  export type MmrChangeMinAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    before?: true
    after?: true
    change?: true
  }

  export type MmrChangeMaxAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    before?: true
    after?: true
    change?: true
  }

  export type MmrChangeCountAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    before?: true
    after?: true
    change?: true
    _all?: true
  }

  export type MmrChangeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MmrChange to aggregate.
     */
    where?: MmrChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MmrChanges to fetch.
     */
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MmrChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MmrChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MmrChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MmrChanges
    **/
    _count?: true | MmrChangeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MmrChangeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MmrChangeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MmrChangeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MmrChangeMaxAggregateInputType
  }

  export type GetMmrChangeAggregateType<T extends MmrChangeAggregateArgs> = {
        [P in keyof T & keyof AggregateMmrChange]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMmrChange[P]>
      : GetScalarType<T[P], AggregateMmrChange[P]>
  }




  export type MmrChangeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MmrChangeWhereInput
    orderBy?: MmrChangeOrderByWithAggregationInput | MmrChangeOrderByWithAggregationInput[]
    by: MmrChangeScalarFieldEnum[] | MmrChangeScalarFieldEnum
    having?: MmrChangeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MmrChangeCountAggregateInputType | true
    _avg?: MmrChangeAvgAggregateInputType
    _sum?: MmrChangeSumAggregateInputType
    _min?: MmrChangeMinAggregateInputType
    _max?: MmrChangeMaxAggregateInputType
  }

  export type MmrChangeGroupByOutputType = {
    id: number
    matchId: number
    userId: number
    before: number
    after: number
    change: number
    _count: MmrChangeCountAggregateOutputType | null
    _avg: MmrChangeAvgAggregateOutputType | null
    _sum: MmrChangeSumAggregateOutputType | null
    _min: MmrChangeMinAggregateOutputType | null
    _max: MmrChangeMaxAggregateOutputType | null
  }

  type GetMmrChangeGroupByPayload<T extends MmrChangeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MmrChangeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MmrChangeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MmrChangeGroupByOutputType[P]>
            : GetScalarType<T[P], MmrChangeGroupByOutputType[P]>
        }
      >
    >


  export type MmrChangeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    before?: boolean
    after?: boolean
    change?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mmrChange"]>

  export type MmrChangeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    before?: boolean
    after?: boolean
    change?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mmrChange"]>

  export type MmrChangeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    before?: boolean
    after?: boolean
    change?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["mmrChange"]>

  export type MmrChangeSelectScalar = {
    id?: boolean
    matchId?: boolean
    userId?: boolean
    before?: boolean
    after?: boolean
    change?: boolean
  }

  export type MmrChangeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchId" | "userId" | "before" | "after" | "change", ExtArgs["result"]["mmrChange"]>
  export type MmrChangeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MmrChangeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MmrChangeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MmrChangePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MmrChange"
    objects: {
      match: Prisma.$MatchPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      matchId: number
      userId: number
      before: number
      after: number
      change: number
    }, ExtArgs["result"]["mmrChange"]>
    composites: {}
  }

  type MmrChangeGetPayload<S extends boolean | null | undefined | MmrChangeDefaultArgs> = $Result.GetResult<Prisma.$MmrChangePayload, S>

  type MmrChangeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MmrChangeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MmrChangeCountAggregateInputType | true
    }

  export interface MmrChangeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MmrChange'], meta: { name: 'MmrChange' } }
    /**
     * Find zero or one MmrChange that matches the filter.
     * @param {MmrChangeFindUniqueArgs} args - Arguments to find a MmrChange
     * @example
     * // Get one MmrChange
     * const mmrChange = await prisma.mmrChange.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MmrChangeFindUniqueArgs>(args: SelectSubset<T, MmrChangeFindUniqueArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MmrChange that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MmrChangeFindUniqueOrThrowArgs} args - Arguments to find a MmrChange
     * @example
     * // Get one MmrChange
     * const mmrChange = await prisma.mmrChange.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MmrChangeFindUniqueOrThrowArgs>(args: SelectSubset<T, MmrChangeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MmrChange that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeFindFirstArgs} args - Arguments to find a MmrChange
     * @example
     * // Get one MmrChange
     * const mmrChange = await prisma.mmrChange.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MmrChangeFindFirstArgs>(args?: SelectSubset<T, MmrChangeFindFirstArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MmrChange that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeFindFirstOrThrowArgs} args - Arguments to find a MmrChange
     * @example
     * // Get one MmrChange
     * const mmrChange = await prisma.mmrChange.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MmrChangeFindFirstOrThrowArgs>(args?: SelectSubset<T, MmrChangeFindFirstOrThrowArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MmrChanges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MmrChanges
     * const mmrChanges = await prisma.mmrChange.findMany()
     * 
     * // Get first 10 MmrChanges
     * const mmrChanges = await prisma.mmrChange.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const mmrChangeWithIdOnly = await prisma.mmrChange.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MmrChangeFindManyArgs>(args?: SelectSubset<T, MmrChangeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MmrChange.
     * @param {MmrChangeCreateArgs} args - Arguments to create a MmrChange.
     * @example
     * // Create one MmrChange
     * const MmrChange = await prisma.mmrChange.create({
     *   data: {
     *     // ... data to create a MmrChange
     *   }
     * })
     * 
     */
    create<T extends MmrChangeCreateArgs>(args: SelectSubset<T, MmrChangeCreateArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MmrChanges.
     * @param {MmrChangeCreateManyArgs} args - Arguments to create many MmrChanges.
     * @example
     * // Create many MmrChanges
     * const mmrChange = await prisma.mmrChange.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MmrChangeCreateManyArgs>(args?: SelectSubset<T, MmrChangeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MmrChanges and returns the data saved in the database.
     * @param {MmrChangeCreateManyAndReturnArgs} args - Arguments to create many MmrChanges.
     * @example
     * // Create many MmrChanges
     * const mmrChange = await prisma.mmrChange.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MmrChanges and only return the `id`
     * const mmrChangeWithIdOnly = await prisma.mmrChange.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MmrChangeCreateManyAndReturnArgs>(args?: SelectSubset<T, MmrChangeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MmrChange.
     * @param {MmrChangeDeleteArgs} args - Arguments to delete one MmrChange.
     * @example
     * // Delete one MmrChange
     * const MmrChange = await prisma.mmrChange.delete({
     *   where: {
     *     // ... filter to delete one MmrChange
     *   }
     * })
     * 
     */
    delete<T extends MmrChangeDeleteArgs>(args: SelectSubset<T, MmrChangeDeleteArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MmrChange.
     * @param {MmrChangeUpdateArgs} args - Arguments to update one MmrChange.
     * @example
     * // Update one MmrChange
     * const mmrChange = await prisma.mmrChange.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MmrChangeUpdateArgs>(args: SelectSubset<T, MmrChangeUpdateArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MmrChanges.
     * @param {MmrChangeDeleteManyArgs} args - Arguments to filter MmrChanges to delete.
     * @example
     * // Delete a few MmrChanges
     * const { count } = await prisma.mmrChange.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MmrChangeDeleteManyArgs>(args?: SelectSubset<T, MmrChangeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MmrChanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MmrChanges
     * const mmrChange = await prisma.mmrChange.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MmrChangeUpdateManyArgs>(args: SelectSubset<T, MmrChangeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MmrChanges and returns the data updated in the database.
     * @param {MmrChangeUpdateManyAndReturnArgs} args - Arguments to update many MmrChanges.
     * @example
     * // Update many MmrChanges
     * const mmrChange = await prisma.mmrChange.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MmrChanges and only return the `id`
     * const mmrChangeWithIdOnly = await prisma.mmrChange.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MmrChangeUpdateManyAndReturnArgs>(args: SelectSubset<T, MmrChangeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MmrChange.
     * @param {MmrChangeUpsertArgs} args - Arguments to update or create a MmrChange.
     * @example
     * // Update or create a MmrChange
     * const mmrChange = await prisma.mmrChange.upsert({
     *   create: {
     *     // ... data to create a MmrChange
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MmrChange we want to update
     *   }
     * })
     */
    upsert<T extends MmrChangeUpsertArgs>(args: SelectSubset<T, MmrChangeUpsertArgs<ExtArgs>>): Prisma__MmrChangeClient<$Result.GetResult<Prisma.$MmrChangePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MmrChanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeCountArgs} args - Arguments to filter MmrChanges to count.
     * @example
     * // Count the number of MmrChanges
     * const count = await prisma.mmrChange.count({
     *   where: {
     *     // ... the filter for the MmrChanges we want to count
     *   }
     * })
    **/
    count<T extends MmrChangeCountArgs>(
      args?: Subset<T, MmrChangeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MmrChangeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MmrChange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MmrChangeAggregateArgs>(args: Subset<T, MmrChangeAggregateArgs>): Prisma.PrismaPromise<GetMmrChangeAggregateType<T>>

    /**
     * Group by MmrChange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MmrChangeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MmrChangeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MmrChangeGroupByArgs['orderBy'] }
        : { orderBy?: MmrChangeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MmrChangeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMmrChangeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MmrChange model
   */
  readonly fields: MmrChangeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MmrChange.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MmrChangeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    match<T extends MatchDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MatchDefaultArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MmrChange model
   */
  interface MmrChangeFieldRefs {
    readonly id: FieldRef<"MmrChange", 'Int'>
    readonly matchId: FieldRef<"MmrChange", 'Int'>
    readonly userId: FieldRef<"MmrChange", 'Int'>
    readonly before: FieldRef<"MmrChange", 'Int'>
    readonly after: FieldRef<"MmrChange", 'Int'>
    readonly change: FieldRef<"MmrChange", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * MmrChange findUnique
   */
  export type MmrChangeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter, which MmrChange to fetch.
     */
    where: MmrChangeWhereUniqueInput
  }

  /**
   * MmrChange findUniqueOrThrow
   */
  export type MmrChangeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter, which MmrChange to fetch.
     */
    where: MmrChangeWhereUniqueInput
  }

  /**
   * MmrChange findFirst
   */
  export type MmrChangeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter, which MmrChange to fetch.
     */
    where?: MmrChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MmrChanges to fetch.
     */
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MmrChanges.
     */
    cursor?: MmrChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MmrChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MmrChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MmrChanges.
     */
    distinct?: MmrChangeScalarFieldEnum | MmrChangeScalarFieldEnum[]
  }

  /**
   * MmrChange findFirstOrThrow
   */
  export type MmrChangeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter, which MmrChange to fetch.
     */
    where?: MmrChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MmrChanges to fetch.
     */
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MmrChanges.
     */
    cursor?: MmrChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MmrChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MmrChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MmrChanges.
     */
    distinct?: MmrChangeScalarFieldEnum | MmrChangeScalarFieldEnum[]
  }

  /**
   * MmrChange findMany
   */
  export type MmrChangeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter, which MmrChanges to fetch.
     */
    where?: MmrChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MmrChanges to fetch.
     */
    orderBy?: MmrChangeOrderByWithRelationInput | MmrChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MmrChanges.
     */
    cursor?: MmrChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MmrChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MmrChanges.
     */
    skip?: number
    distinct?: MmrChangeScalarFieldEnum | MmrChangeScalarFieldEnum[]
  }

  /**
   * MmrChange create
   */
  export type MmrChangeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * The data needed to create a MmrChange.
     */
    data: XOR<MmrChangeCreateInput, MmrChangeUncheckedCreateInput>
  }

  /**
   * MmrChange createMany
   */
  export type MmrChangeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MmrChanges.
     */
    data: MmrChangeCreateManyInput | MmrChangeCreateManyInput[]
  }

  /**
   * MmrChange createManyAndReturn
   */
  export type MmrChangeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * The data used to create many MmrChanges.
     */
    data: MmrChangeCreateManyInput | MmrChangeCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MmrChange update
   */
  export type MmrChangeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * The data needed to update a MmrChange.
     */
    data: XOR<MmrChangeUpdateInput, MmrChangeUncheckedUpdateInput>
    /**
     * Choose, which MmrChange to update.
     */
    where: MmrChangeWhereUniqueInput
  }

  /**
   * MmrChange updateMany
   */
  export type MmrChangeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MmrChanges.
     */
    data: XOR<MmrChangeUpdateManyMutationInput, MmrChangeUncheckedUpdateManyInput>
    /**
     * Filter which MmrChanges to update
     */
    where?: MmrChangeWhereInput
    /**
     * Limit how many MmrChanges to update.
     */
    limit?: number
  }

  /**
   * MmrChange updateManyAndReturn
   */
  export type MmrChangeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * The data used to update MmrChanges.
     */
    data: XOR<MmrChangeUpdateManyMutationInput, MmrChangeUncheckedUpdateManyInput>
    /**
     * Filter which MmrChanges to update
     */
    where?: MmrChangeWhereInput
    /**
     * Limit how many MmrChanges to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MmrChange upsert
   */
  export type MmrChangeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * The filter to search for the MmrChange to update in case it exists.
     */
    where: MmrChangeWhereUniqueInput
    /**
     * In case the MmrChange found by the `where` argument doesn't exist, create a new MmrChange with this data.
     */
    create: XOR<MmrChangeCreateInput, MmrChangeUncheckedCreateInput>
    /**
     * In case the MmrChange was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MmrChangeUpdateInput, MmrChangeUncheckedUpdateInput>
  }

  /**
   * MmrChange delete
   */
  export type MmrChangeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
    /**
     * Filter which MmrChange to delete.
     */
    where: MmrChangeWhereUniqueInput
  }

  /**
   * MmrChange deleteMany
   */
  export type MmrChangeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MmrChanges to delete
     */
    where?: MmrChangeWhereInput
    /**
     * Limit how many MmrChanges to delete.
     */
    limit?: number
  }

  /**
   * MmrChange without action
   */
  export type MmrChangeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MmrChange
     */
    select?: MmrChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MmrChange
     */
    omit?: MmrChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MmrChangeInclude<ExtArgs> | null
  }


  /**
   * Model EventLog
   */

  export type AggregateEventLog = {
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  export type EventLogAvgAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
  }

  export type EventLogSumAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
  }

  export type EventLogMinAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    timestamp: Date | null
    type: string | null
    message: string | null
  }

  export type EventLogMaxAggregateOutputType = {
    id: number | null
    matchId: number | null
    userId: number | null
    timestamp: Date | null
    type: string | null
    message: string | null
  }

  export type EventLogCountAggregateOutputType = {
    id: number
    matchId: number
    userId: number
    timestamp: number
    type: number
    message: number
    _all: number
  }


  export type EventLogAvgAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
  }

  export type EventLogSumAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
  }

  export type EventLogMinAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    timestamp?: true
    type?: true
    message?: true
  }

  export type EventLogMaxAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    timestamp?: true
    type?: true
    message?: true
  }

  export type EventLogCountAggregateInputType = {
    id?: true
    matchId?: true
    userId?: true
    timestamp?: true
    type?: true
    message?: true
    _all?: true
  }

  export type EventLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLog to aggregate.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventLogs
    **/
    _count?: true | EventLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventLogMaxAggregateInputType
  }

  export type GetEventLogAggregateType<T extends EventLogAggregateArgs> = {
        [P in keyof T & keyof AggregateEventLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventLog[P]>
      : GetScalarType<T[P], AggregateEventLog[P]>
  }




  export type EventLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithAggregationInput | EventLogOrderByWithAggregationInput[]
    by: EventLogScalarFieldEnum[] | EventLogScalarFieldEnum
    having?: EventLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventLogCountAggregateInputType | true
    _avg?: EventLogAvgAggregateInputType
    _sum?: EventLogSumAggregateInputType
    _min?: EventLogMinAggregateInputType
    _max?: EventLogMaxAggregateInputType
  }

  export type EventLogGroupByOutputType = {
    id: number
    matchId: number
    userId: number | null
    timestamp: Date
    type: string
    message: string
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  type GetEventLogGroupByPayload<T extends EventLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventLogGroupByOutputType[P]>
            : GetScalarType<T[P], EventLogGroupByOutputType[P]>
        }
      >
    >


  export type EventLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    timestamp?: boolean
    type?: boolean
    message?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    timestamp?: boolean
    type?: boolean
    message?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchId?: boolean
    userId?: boolean
    timestamp?: boolean
    type?: boolean
    message?: boolean
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectScalar = {
    id?: boolean
    matchId?: boolean
    userId?: boolean
    timestamp?: boolean
    type?: boolean
    message?: boolean
  }

  export type EventLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchId" | "userId" | "timestamp" | "type" | "message", ExtArgs["result"]["eventLog"]>
  export type EventLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }
  export type EventLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }
  export type EventLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    match?: boolean | MatchDefaultArgs<ExtArgs>
    user?: boolean | EventLog$userArgs<ExtArgs>
  }

  export type $EventLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventLog"
    objects: {
      match: Prisma.$MatchPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      matchId: number
      userId: number | null
      timestamp: Date
      type: string
      message: string
    }, ExtArgs["result"]["eventLog"]>
    composites: {}
  }

  type EventLogGetPayload<S extends boolean | null | undefined | EventLogDefaultArgs> = $Result.GetResult<Prisma.$EventLogPayload, S>

  type EventLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventLogCountAggregateInputType | true
    }

  export interface EventLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventLog'], meta: { name: 'EventLog' } }
    /**
     * Find zero or one EventLog that matches the filter.
     * @param {EventLogFindUniqueArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventLogFindUniqueArgs>(args: SelectSubset<T, EventLogFindUniqueArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventLogFindUniqueOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventLogFindUniqueOrThrowArgs>(args: SelectSubset<T, EventLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventLogFindFirstArgs>(args?: SelectSubset<T, EventLogFindFirstArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventLogFindFirstOrThrowArgs>(args?: SelectSubset<T, EventLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventLogs
     * const eventLogs = await prisma.eventLog.findMany()
     * 
     * // Get first 10 EventLogs
     * const eventLogs = await prisma.eventLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventLogFindManyArgs>(args?: SelectSubset<T, EventLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventLog.
     * @param {EventLogCreateArgs} args - Arguments to create a EventLog.
     * @example
     * // Create one EventLog
     * const EventLog = await prisma.eventLog.create({
     *   data: {
     *     // ... data to create a EventLog
     *   }
     * })
     * 
     */
    create<T extends EventLogCreateArgs>(args: SelectSubset<T, EventLogCreateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventLogs.
     * @param {EventLogCreateManyArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventLogCreateManyArgs>(args?: SelectSubset<T, EventLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventLogs and returns the data saved in the database.
     * @param {EventLogCreateManyAndReturnArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventLogs and only return the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventLogCreateManyAndReturnArgs>(args?: SelectSubset<T, EventLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventLog.
     * @param {EventLogDeleteArgs} args - Arguments to delete one EventLog.
     * @example
     * // Delete one EventLog
     * const EventLog = await prisma.eventLog.delete({
     *   where: {
     *     // ... filter to delete one EventLog
     *   }
     * })
     * 
     */
    delete<T extends EventLogDeleteArgs>(args: SelectSubset<T, EventLogDeleteArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventLog.
     * @param {EventLogUpdateArgs} args - Arguments to update one EventLog.
     * @example
     * // Update one EventLog
     * const eventLog = await prisma.eventLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventLogUpdateArgs>(args: SelectSubset<T, EventLogUpdateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventLogs.
     * @param {EventLogDeleteManyArgs} args - Arguments to filter EventLogs to delete.
     * @example
     * // Delete a few EventLogs
     * const { count } = await prisma.eventLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventLogDeleteManyArgs>(args?: SelectSubset<T, EventLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventLogs
     * const eventLog = await prisma.eventLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventLogUpdateManyArgs>(args: SelectSubset<T, EventLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventLogs and returns the data updated in the database.
     * @param {EventLogUpdateManyAndReturnArgs} args - Arguments to update many EventLogs.
     * @example
     * // Update many EventLogs
     * const eventLog = await prisma.eventLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventLogs and only return the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventLogUpdateManyAndReturnArgs>(args: SelectSubset<T, EventLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventLog.
     * @param {EventLogUpsertArgs} args - Arguments to update or create a EventLog.
     * @example
     * // Update or create a EventLog
     * const eventLog = await prisma.eventLog.upsert({
     *   create: {
     *     // ... data to create a EventLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventLog we want to update
     *   }
     * })
     */
    upsert<T extends EventLogUpsertArgs>(args: SelectSubset<T, EventLogUpsertArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogCountArgs} args - Arguments to filter EventLogs to count.
     * @example
     * // Count the number of EventLogs
     * const count = await prisma.eventLog.count({
     *   where: {
     *     // ... the filter for the EventLogs we want to count
     *   }
     * })
    **/
    count<T extends EventLogCountArgs>(
      args?: Subset<T, EventLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventLogAggregateArgs>(args: Subset<T, EventLogAggregateArgs>): Prisma.PrismaPromise<GetEventLogAggregateType<T>>

    /**
     * Group by EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventLogGroupByArgs['orderBy'] }
        : { orderBy?: EventLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventLog model
   */
  readonly fields: EventLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    match<T extends MatchDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MatchDefaultArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends EventLog$userArgs<ExtArgs> = {}>(args?: Subset<T, EventLog$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventLog model
   */
  interface EventLogFieldRefs {
    readonly id: FieldRef<"EventLog", 'Int'>
    readonly matchId: FieldRef<"EventLog", 'Int'>
    readonly userId: FieldRef<"EventLog", 'Int'>
    readonly timestamp: FieldRef<"EventLog", 'DateTime'>
    readonly type: FieldRef<"EventLog", 'String'>
    readonly message: FieldRef<"EventLog", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EventLog findUnique
   */
  export type EventLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findUniqueOrThrow
   */
  export type EventLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findFirst
   */
  export type EventLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findFirstOrThrow
   */
  export type EventLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findMany
   */
  export type EventLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter, which EventLogs to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog create
   */
  export type EventLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The data needed to create a EventLog.
     */
    data: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
  }

  /**
   * EventLog createMany
   */
  export type EventLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
  }

  /**
   * EventLog createManyAndReturn
   */
  export type EventLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventLog update
   */
  export type EventLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The data needed to update a EventLog.
     */
    data: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
    /**
     * Choose, which EventLog to update.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog updateMany
   */
  export type EventLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventLogs.
     */
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyInput>
    /**
     * Filter which EventLogs to update
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to update.
     */
    limit?: number
  }

  /**
   * EventLog updateManyAndReturn
   */
  export type EventLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * The data used to update EventLogs.
     */
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyInput>
    /**
     * Filter which EventLogs to update
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventLog upsert
   */
  export type EventLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * The filter to search for the EventLog to update in case it exists.
     */
    where: EventLogWhereUniqueInput
    /**
     * In case the EventLog found by the `where` argument doesn't exist, create a new EventLog with this data.
     */
    create: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
    /**
     * In case the EventLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
  }

  /**
   * EventLog delete
   */
  export type EventLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
    /**
     * Filter which EventLog to delete.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog deleteMany
   */
  export type EventLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLogs to delete
     */
    where?: EventLogWhereInput
    /**
     * Limit how many EventLogs to delete.
     */
    limit?: number
  }

  /**
   * EventLog.user
   */
  export type EventLog$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * EventLog without action
   */
  export type EventLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventLog
     */
    omit?: EventLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    bnetId: 'bnetId',
    battletag: 'battletag',
    nickname: 'nickname',
    profilePicture: 'profilePicture',
    mmr: 'mmr',
    wins: 'wins',
    losses: 'losses',
    isAdmin: 'isAdmin',
    isDummy: 'isDummy',
    createdAt: 'createdAt',
    lastLogin: 'lastLogin'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const UserRoleScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    role: 'role'
  };

  export type UserRoleScalarFieldEnum = (typeof UserRoleScalarFieldEnum)[keyof typeof UserRoleScalarFieldEnum]


  export const MatchScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    createdById: 'createdById',
    status: 'status',
    gameMode: 'gameMode',
    maxPlayers: 'maxPlayers',
    map: 'map',
    isPrivate: 'isPrivate',
    password: 'password',
    balanceType: 'balanceType',
    isSimulation: 'isSimulation',
    originalMatchId: 'originalMatchId',
    replayData: 'replayData',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    scheduledTime: 'scheduledTime',
    winner: 'winner',
    blueScore: 'blueScore',
    redScore: 'redScore',
    duration: 'duration'
  };

  export type MatchScalarFieldEnum = (typeof MatchScalarFieldEnum)[keyof typeof MatchScalarFieldEnum]


  export const MatchPlayerScalarFieldEnum: {
    id: 'id',
    matchId: 'matchId',
    userId: 'userId',
    team: 'team',
    role: 'role',
    hero: 'hero',
    joinedAt: 'joinedAt'
  };

  export type MatchPlayerScalarFieldEnum = (typeof MatchPlayerScalarFieldEnum)[keyof typeof MatchPlayerScalarFieldEnum]


  export const PlayerStatScalarFieldEnum: {
    id: 'id',
    matchId: 'matchId',
    userId: 'userId',
    userIdString: 'userIdString',
    battletag: 'battletag',
    team: 'team',
    hero: 'hero',
    kills: 'kills',
    deaths: 'deaths',
    assists: 'assists',
    heroDamage: 'heroDamage',
    siegeDamage: 'siegeDamage',
    healing: 'healing',
    experienceContribution: 'experienceContribution',
    mmrBefore: 'mmrBefore',
    mmrAfter: 'mmrAfter',
    mmrChange: 'mmrChange'
  };

  export type PlayerStatScalarFieldEnum = (typeof PlayerStatScalarFieldEnum)[keyof typeof PlayerStatScalarFieldEnum]


  export const MmrChangeScalarFieldEnum: {
    id: 'id',
    matchId: 'matchId',
    userId: 'userId',
    before: 'before',
    after: 'after',
    change: 'change'
  };

  export type MmrChangeScalarFieldEnum = (typeof MmrChangeScalarFieldEnum)[keyof typeof MmrChangeScalarFieldEnum]


  export const EventLogScalarFieldEnum: {
    id: 'id',
    matchId: 'matchId',
    userId: 'userId',
    timestamp: 'timestamp',
    type: 'type',
    message: 'message'
  };

  export type EventLogScalarFieldEnum = (typeof EventLogScalarFieldEnum)[keyof typeof EventLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'MatchStatus'
   */
  export type EnumMatchStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MatchStatus'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Team'
   */
  export type EnumTeamFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Team'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    bnetId?: StringFilter<"User"> | string
    battletag?: StringFilter<"User"> | string
    nickname?: StringFilter<"User"> | string
    profilePicture?: StringNullableFilter<"User"> | string | null
    mmr?: IntFilter<"User"> | number
    wins?: IntFilter<"User"> | number
    losses?: IntFilter<"User"> | number
    isAdmin?: BoolFilter<"User"> | boolean
    isDummy?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    lastLogin?: DateTimeFilter<"User"> | Date | string
    roles?: UserRoleListRelationFilter
    createdMatches?: MatchListRelationFilter
    matchPlayers?: MatchPlayerListRelationFilter
    playerStats?: PlayerStatListRelationFilter
    mmrChanges?: MmrChangeListRelationFilter
    eventLogs?: EventLogListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    bnetId?: SortOrder
    battletag?: SortOrder
    nickname?: SortOrder
    profilePicture?: SortOrderInput | SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
    isAdmin?: SortOrder
    isDummy?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
    roles?: UserRoleOrderByRelationAggregateInput
    createdMatches?: MatchOrderByRelationAggregateInput
    matchPlayers?: MatchPlayerOrderByRelationAggregateInput
    playerStats?: PlayerStatOrderByRelationAggregateInput
    mmrChanges?: MmrChangeOrderByRelationAggregateInput
    eventLogs?: EventLogOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    bnetId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    battletag?: StringFilter<"User"> | string
    nickname?: StringFilter<"User"> | string
    profilePicture?: StringNullableFilter<"User"> | string | null
    mmr?: IntFilter<"User"> | number
    wins?: IntFilter<"User"> | number
    losses?: IntFilter<"User"> | number
    isAdmin?: BoolFilter<"User"> | boolean
    isDummy?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    lastLogin?: DateTimeFilter<"User"> | Date | string
    roles?: UserRoleListRelationFilter
    createdMatches?: MatchListRelationFilter
    matchPlayers?: MatchPlayerListRelationFilter
    playerStats?: PlayerStatListRelationFilter
    mmrChanges?: MmrChangeListRelationFilter
    eventLogs?: EventLogListRelationFilter
  }, "id" | "bnetId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    bnetId?: SortOrder
    battletag?: SortOrder
    nickname?: SortOrder
    profilePicture?: SortOrderInput | SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
    isAdmin?: SortOrder
    isDummy?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    bnetId?: StringWithAggregatesFilter<"User"> | string
    battletag?: StringWithAggregatesFilter<"User"> | string
    nickname?: StringWithAggregatesFilter<"User"> | string
    profilePicture?: StringNullableWithAggregatesFilter<"User"> | string | null
    mmr?: IntWithAggregatesFilter<"User"> | number
    wins?: IntWithAggregatesFilter<"User"> | number
    losses?: IntWithAggregatesFilter<"User"> | number
    isAdmin?: BoolWithAggregatesFilter<"User"> | boolean
    isDummy?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    lastLogin?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type UserRoleWhereInput = {
    AND?: UserRoleWhereInput | UserRoleWhereInput[]
    OR?: UserRoleWhereInput[]
    NOT?: UserRoleWhereInput | UserRoleWhereInput[]
    id?: IntFilter<"UserRole"> | number
    userId?: IntFilter<"UserRole"> | number
    role?: StringFilter<"UserRole"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UserRoleOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    role?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UserRoleWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: UserRoleWhereInput | UserRoleWhereInput[]
    OR?: UserRoleWhereInput[]
    NOT?: UserRoleWhereInput | UserRoleWhereInput[]
    userId?: IntFilter<"UserRole"> | number
    role?: StringFilter<"UserRole"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type UserRoleOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    role?: SortOrder
    _count?: UserRoleCountOrderByAggregateInput
    _avg?: UserRoleAvgOrderByAggregateInput
    _max?: UserRoleMaxOrderByAggregateInput
    _min?: UserRoleMinOrderByAggregateInput
    _sum?: UserRoleSumOrderByAggregateInput
  }

  export type UserRoleScalarWhereWithAggregatesInput = {
    AND?: UserRoleScalarWhereWithAggregatesInput | UserRoleScalarWhereWithAggregatesInput[]
    OR?: UserRoleScalarWhereWithAggregatesInput[]
    NOT?: UserRoleScalarWhereWithAggregatesInput | UserRoleScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"UserRole"> | number
    userId?: IntWithAggregatesFilter<"UserRole"> | number
    role?: StringWithAggregatesFilter<"UserRole"> | string
  }

  export type MatchWhereInput = {
    AND?: MatchWhereInput | MatchWhereInput[]
    OR?: MatchWhereInput[]
    NOT?: MatchWhereInput | MatchWhereInput[]
    id?: IntFilter<"Match"> | number
    title?: StringFilter<"Match"> | string
    description?: StringNullableFilter<"Match"> | string | null
    createdById?: IntFilter<"Match"> | number
    status?: EnumMatchStatusFilter<"Match"> | $Enums.MatchStatus
    gameMode?: StringFilter<"Match"> | string
    maxPlayers?: IntFilter<"Match"> | number
    map?: StringNullableFilter<"Match"> | string | null
    isPrivate?: BoolFilter<"Match"> | boolean
    password?: StringNullableFilter<"Match"> | string | null
    balanceType?: StringFilter<"Match"> | string
    isSimulation?: BoolFilter<"Match"> | boolean
    originalMatchId?: StringNullableFilter<"Match"> | string | null
    replayData?: JsonNullableFilter<"Match">
    createdAt?: DateTimeFilter<"Match"> | Date | string
    updatedAt?: DateTimeFilter<"Match"> | Date | string
    scheduledTime?: DateTimeFilter<"Match"> | Date | string
    winner?: StringNullableFilter<"Match"> | string | null
    blueScore?: IntFilter<"Match"> | number
    redScore?: IntFilter<"Match"> | number
    duration?: IntFilter<"Match"> | number
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    players?: MatchPlayerListRelationFilter
    playerStats?: PlayerStatListRelationFilter
    mmrChanges?: MmrChangeListRelationFilter
    eventLogs?: EventLogListRelationFilter
  }

  export type MatchOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    createdById?: SortOrder
    status?: SortOrder
    gameMode?: SortOrder
    maxPlayers?: SortOrder
    map?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    password?: SortOrderInput | SortOrder
    balanceType?: SortOrder
    isSimulation?: SortOrder
    originalMatchId?: SortOrderInput | SortOrder
    replayData?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    scheduledTime?: SortOrder
    winner?: SortOrderInput | SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
    createdBy?: UserOrderByWithRelationInput
    players?: MatchPlayerOrderByRelationAggregateInput
    playerStats?: PlayerStatOrderByRelationAggregateInput
    mmrChanges?: MmrChangeOrderByRelationAggregateInput
    eventLogs?: EventLogOrderByRelationAggregateInput
  }

  export type MatchWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: MatchWhereInput | MatchWhereInput[]
    OR?: MatchWhereInput[]
    NOT?: MatchWhereInput | MatchWhereInput[]
    title?: StringFilter<"Match"> | string
    description?: StringNullableFilter<"Match"> | string | null
    createdById?: IntFilter<"Match"> | number
    status?: EnumMatchStatusFilter<"Match"> | $Enums.MatchStatus
    gameMode?: StringFilter<"Match"> | string
    maxPlayers?: IntFilter<"Match"> | number
    map?: StringNullableFilter<"Match"> | string | null
    isPrivate?: BoolFilter<"Match"> | boolean
    password?: StringNullableFilter<"Match"> | string | null
    balanceType?: StringFilter<"Match"> | string
    isSimulation?: BoolFilter<"Match"> | boolean
    originalMatchId?: StringNullableFilter<"Match"> | string | null
    replayData?: JsonNullableFilter<"Match">
    createdAt?: DateTimeFilter<"Match"> | Date | string
    updatedAt?: DateTimeFilter<"Match"> | Date | string
    scheduledTime?: DateTimeFilter<"Match"> | Date | string
    winner?: StringNullableFilter<"Match"> | string | null
    blueScore?: IntFilter<"Match"> | number
    redScore?: IntFilter<"Match"> | number
    duration?: IntFilter<"Match"> | number
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    players?: MatchPlayerListRelationFilter
    playerStats?: PlayerStatListRelationFilter
    mmrChanges?: MmrChangeListRelationFilter
    eventLogs?: EventLogListRelationFilter
  }, "id">

  export type MatchOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    createdById?: SortOrder
    status?: SortOrder
    gameMode?: SortOrder
    maxPlayers?: SortOrder
    map?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    password?: SortOrderInput | SortOrder
    balanceType?: SortOrder
    isSimulation?: SortOrder
    originalMatchId?: SortOrderInput | SortOrder
    replayData?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    scheduledTime?: SortOrder
    winner?: SortOrderInput | SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
    _count?: MatchCountOrderByAggregateInput
    _avg?: MatchAvgOrderByAggregateInput
    _max?: MatchMaxOrderByAggregateInput
    _min?: MatchMinOrderByAggregateInput
    _sum?: MatchSumOrderByAggregateInput
  }

  export type MatchScalarWhereWithAggregatesInput = {
    AND?: MatchScalarWhereWithAggregatesInput | MatchScalarWhereWithAggregatesInput[]
    OR?: MatchScalarWhereWithAggregatesInput[]
    NOT?: MatchScalarWhereWithAggregatesInput | MatchScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Match"> | number
    title?: StringWithAggregatesFilter<"Match"> | string
    description?: StringNullableWithAggregatesFilter<"Match"> | string | null
    createdById?: IntWithAggregatesFilter<"Match"> | number
    status?: EnumMatchStatusWithAggregatesFilter<"Match"> | $Enums.MatchStatus
    gameMode?: StringWithAggregatesFilter<"Match"> | string
    maxPlayers?: IntWithAggregatesFilter<"Match"> | number
    map?: StringNullableWithAggregatesFilter<"Match"> | string | null
    isPrivate?: BoolWithAggregatesFilter<"Match"> | boolean
    password?: StringNullableWithAggregatesFilter<"Match"> | string | null
    balanceType?: StringWithAggregatesFilter<"Match"> | string
    isSimulation?: BoolWithAggregatesFilter<"Match"> | boolean
    originalMatchId?: StringNullableWithAggregatesFilter<"Match"> | string | null
    replayData?: JsonNullableWithAggregatesFilter<"Match">
    createdAt?: DateTimeWithAggregatesFilter<"Match"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Match"> | Date | string
    scheduledTime?: DateTimeWithAggregatesFilter<"Match"> | Date | string
    winner?: StringNullableWithAggregatesFilter<"Match"> | string | null
    blueScore?: IntWithAggregatesFilter<"Match"> | number
    redScore?: IntWithAggregatesFilter<"Match"> | number
    duration?: IntWithAggregatesFilter<"Match"> | number
  }

  export type MatchPlayerWhereInput = {
    AND?: MatchPlayerWhereInput | MatchPlayerWhereInput[]
    OR?: MatchPlayerWhereInput[]
    NOT?: MatchPlayerWhereInput | MatchPlayerWhereInput[]
    id?: IntFilter<"MatchPlayer"> | number
    matchId?: IntFilter<"MatchPlayer"> | number
    userId?: IntFilter<"MatchPlayer"> | number
    team?: EnumTeamFilter<"MatchPlayer"> | $Enums.Team
    role?: StringNullableFilter<"MatchPlayer"> | string | null
    hero?: StringNullableFilter<"MatchPlayer"> | string | null
    joinedAt?: DateTimeFilter<"MatchPlayer"> | Date | string
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type MatchPlayerOrderByWithRelationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    team?: SortOrder
    role?: SortOrderInput | SortOrder
    hero?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    match?: MatchOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type MatchPlayerWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    matchId_userId?: MatchPlayerMatchIdUserIdCompoundUniqueInput
    AND?: MatchPlayerWhereInput | MatchPlayerWhereInput[]
    OR?: MatchPlayerWhereInput[]
    NOT?: MatchPlayerWhereInput | MatchPlayerWhereInput[]
    matchId?: IntFilter<"MatchPlayer"> | number
    userId?: IntFilter<"MatchPlayer"> | number
    team?: EnumTeamFilter<"MatchPlayer"> | $Enums.Team
    role?: StringNullableFilter<"MatchPlayer"> | string | null
    hero?: StringNullableFilter<"MatchPlayer"> | string | null
    joinedAt?: DateTimeFilter<"MatchPlayer"> | Date | string
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "matchId_userId">

  export type MatchPlayerOrderByWithAggregationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    team?: SortOrder
    role?: SortOrderInput | SortOrder
    hero?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    _count?: MatchPlayerCountOrderByAggregateInput
    _avg?: MatchPlayerAvgOrderByAggregateInput
    _max?: MatchPlayerMaxOrderByAggregateInput
    _min?: MatchPlayerMinOrderByAggregateInput
    _sum?: MatchPlayerSumOrderByAggregateInput
  }

  export type MatchPlayerScalarWhereWithAggregatesInput = {
    AND?: MatchPlayerScalarWhereWithAggregatesInput | MatchPlayerScalarWhereWithAggregatesInput[]
    OR?: MatchPlayerScalarWhereWithAggregatesInput[]
    NOT?: MatchPlayerScalarWhereWithAggregatesInput | MatchPlayerScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"MatchPlayer"> | number
    matchId?: IntWithAggregatesFilter<"MatchPlayer"> | number
    userId?: IntWithAggregatesFilter<"MatchPlayer"> | number
    team?: EnumTeamWithAggregatesFilter<"MatchPlayer"> | $Enums.Team
    role?: StringNullableWithAggregatesFilter<"MatchPlayer"> | string | null
    hero?: StringNullableWithAggregatesFilter<"MatchPlayer"> | string | null
    joinedAt?: DateTimeWithAggregatesFilter<"MatchPlayer"> | Date | string
  }

  export type PlayerStatWhereInput = {
    AND?: PlayerStatWhereInput | PlayerStatWhereInput[]
    OR?: PlayerStatWhereInput[]
    NOT?: PlayerStatWhereInput | PlayerStatWhereInput[]
    id?: IntFilter<"PlayerStat"> | number
    matchId?: IntFilter<"PlayerStat"> | number
    userId?: IntNullableFilter<"PlayerStat"> | number | null
    userIdString?: StringNullableFilter<"PlayerStat"> | string | null
    battletag?: StringFilter<"PlayerStat"> | string
    team?: EnumTeamFilter<"PlayerStat"> | $Enums.Team
    hero?: StringNullableFilter<"PlayerStat"> | string | null
    kills?: IntNullableFilter<"PlayerStat"> | number | null
    deaths?: IntNullableFilter<"PlayerStat"> | number | null
    assists?: IntNullableFilter<"PlayerStat"> | number | null
    heroDamage?: IntNullableFilter<"PlayerStat"> | number | null
    siegeDamage?: IntNullableFilter<"PlayerStat"> | number | null
    healing?: IntNullableFilter<"PlayerStat"> | number | null
    experienceContribution?: IntNullableFilter<"PlayerStat"> | number | null
    mmrBefore?: IntNullableFilter<"PlayerStat"> | number | null
    mmrAfter?: IntNullableFilter<"PlayerStat"> | number | null
    mmrChange?: IntNullableFilter<"PlayerStat"> | number | null
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type PlayerStatOrderByWithRelationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrderInput | SortOrder
    userIdString?: SortOrderInput | SortOrder
    battletag?: SortOrder
    team?: SortOrder
    hero?: SortOrderInput | SortOrder
    kills?: SortOrderInput | SortOrder
    deaths?: SortOrderInput | SortOrder
    assists?: SortOrderInput | SortOrder
    heroDamage?: SortOrderInput | SortOrder
    siegeDamage?: SortOrderInput | SortOrder
    healing?: SortOrderInput | SortOrder
    experienceContribution?: SortOrderInput | SortOrder
    mmrBefore?: SortOrderInput | SortOrder
    mmrAfter?: SortOrderInput | SortOrder
    mmrChange?: SortOrderInput | SortOrder
    match?: MatchOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type PlayerStatWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PlayerStatWhereInput | PlayerStatWhereInput[]
    OR?: PlayerStatWhereInput[]
    NOT?: PlayerStatWhereInput | PlayerStatWhereInput[]
    matchId?: IntFilter<"PlayerStat"> | number
    userId?: IntNullableFilter<"PlayerStat"> | number | null
    userIdString?: StringNullableFilter<"PlayerStat"> | string | null
    battletag?: StringFilter<"PlayerStat"> | string
    team?: EnumTeamFilter<"PlayerStat"> | $Enums.Team
    hero?: StringNullableFilter<"PlayerStat"> | string | null
    kills?: IntNullableFilter<"PlayerStat"> | number | null
    deaths?: IntNullableFilter<"PlayerStat"> | number | null
    assists?: IntNullableFilter<"PlayerStat"> | number | null
    heroDamage?: IntNullableFilter<"PlayerStat"> | number | null
    siegeDamage?: IntNullableFilter<"PlayerStat"> | number | null
    healing?: IntNullableFilter<"PlayerStat"> | number | null
    experienceContribution?: IntNullableFilter<"PlayerStat"> | number | null
    mmrBefore?: IntNullableFilter<"PlayerStat"> | number | null
    mmrAfter?: IntNullableFilter<"PlayerStat"> | number | null
    mmrChange?: IntNullableFilter<"PlayerStat"> | number | null
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id">

  export type PlayerStatOrderByWithAggregationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrderInput | SortOrder
    userIdString?: SortOrderInput | SortOrder
    battletag?: SortOrder
    team?: SortOrder
    hero?: SortOrderInput | SortOrder
    kills?: SortOrderInput | SortOrder
    deaths?: SortOrderInput | SortOrder
    assists?: SortOrderInput | SortOrder
    heroDamage?: SortOrderInput | SortOrder
    siegeDamage?: SortOrderInput | SortOrder
    healing?: SortOrderInput | SortOrder
    experienceContribution?: SortOrderInput | SortOrder
    mmrBefore?: SortOrderInput | SortOrder
    mmrAfter?: SortOrderInput | SortOrder
    mmrChange?: SortOrderInput | SortOrder
    _count?: PlayerStatCountOrderByAggregateInput
    _avg?: PlayerStatAvgOrderByAggregateInput
    _max?: PlayerStatMaxOrderByAggregateInput
    _min?: PlayerStatMinOrderByAggregateInput
    _sum?: PlayerStatSumOrderByAggregateInput
  }

  export type PlayerStatScalarWhereWithAggregatesInput = {
    AND?: PlayerStatScalarWhereWithAggregatesInput | PlayerStatScalarWhereWithAggregatesInput[]
    OR?: PlayerStatScalarWhereWithAggregatesInput[]
    NOT?: PlayerStatScalarWhereWithAggregatesInput | PlayerStatScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PlayerStat"> | number
    matchId?: IntWithAggregatesFilter<"PlayerStat"> | number
    userId?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    userIdString?: StringNullableWithAggregatesFilter<"PlayerStat"> | string | null
    battletag?: StringWithAggregatesFilter<"PlayerStat"> | string
    team?: EnumTeamWithAggregatesFilter<"PlayerStat"> | $Enums.Team
    hero?: StringNullableWithAggregatesFilter<"PlayerStat"> | string | null
    kills?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    deaths?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    assists?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    heroDamage?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    siegeDamage?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    healing?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    experienceContribution?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    mmrBefore?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    mmrAfter?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
    mmrChange?: IntNullableWithAggregatesFilter<"PlayerStat"> | number | null
  }

  export type MmrChangeWhereInput = {
    AND?: MmrChangeWhereInput | MmrChangeWhereInput[]
    OR?: MmrChangeWhereInput[]
    NOT?: MmrChangeWhereInput | MmrChangeWhereInput[]
    id?: IntFilter<"MmrChange"> | number
    matchId?: IntFilter<"MmrChange"> | number
    userId?: IntFilter<"MmrChange"> | number
    before?: IntFilter<"MmrChange"> | number
    after?: IntFilter<"MmrChange"> | number
    change?: IntFilter<"MmrChange"> | number
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type MmrChangeOrderByWithRelationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
    match?: MatchOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type MmrChangeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: MmrChangeWhereInput | MmrChangeWhereInput[]
    OR?: MmrChangeWhereInput[]
    NOT?: MmrChangeWhereInput | MmrChangeWhereInput[]
    matchId?: IntFilter<"MmrChange"> | number
    userId?: IntFilter<"MmrChange"> | number
    before?: IntFilter<"MmrChange"> | number
    after?: IntFilter<"MmrChange"> | number
    change?: IntFilter<"MmrChange"> | number
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type MmrChangeOrderByWithAggregationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
    _count?: MmrChangeCountOrderByAggregateInput
    _avg?: MmrChangeAvgOrderByAggregateInput
    _max?: MmrChangeMaxOrderByAggregateInput
    _min?: MmrChangeMinOrderByAggregateInput
    _sum?: MmrChangeSumOrderByAggregateInput
  }

  export type MmrChangeScalarWhereWithAggregatesInput = {
    AND?: MmrChangeScalarWhereWithAggregatesInput | MmrChangeScalarWhereWithAggregatesInput[]
    OR?: MmrChangeScalarWhereWithAggregatesInput[]
    NOT?: MmrChangeScalarWhereWithAggregatesInput | MmrChangeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"MmrChange"> | number
    matchId?: IntWithAggregatesFilter<"MmrChange"> | number
    userId?: IntWithAggregatesFilter<"MmrChange"> | number
    before?: IntWithAggregatesFilter<"MmrChange"> | number
    after?: IntWithAggregatesFilter<"MmrChange"> | number
    change?: IntWithAggregatesFilter<"MmrChange"> | number
  }

  export type EventLogWhereInput = {
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    id?: IntFilter<"EventLog"> | number
    matchId?: IntFilter<"EventLog"> | number
    userId?: IntNullableFilter<"EventLog"> | number | null
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    type?: StringFilter<"EventLog"> | string
    message?: StringFilter<"EventLog"> | string
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type EventLogOrderByWithRelationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    type?: SortOrder
    message?: SortOrder
    match?: MatchOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type EventLogWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    matchId?: IntFilter<"EventLog"> | number
    userId?: IntNullableFilter<"EventLog"> | number | null
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    type?: StringFilter<"EventLog"> | string
    message?: StringFilter<"EventLog"> | string
    match?: XOR<MatchScalarRelationFilter, MatchWhereInput>
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id">

  export type EventLogOrderByWithAggregationInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    type?: SortOrder
    message?: SortOrder
    _count?: EventLogCountOrderByAggregateInput
    _avg?: EventLogAvgOrderByAggregateInput
    _max?: EventLogMaxOrderByAggregateInput
    _min?: EventLogMinOrderByAggregateInput
    _sum?: EventLogSumOrderByAggregateInput
  }

  export type EventLogScalarWhereWithAggregatesInput = {
    AND?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    OR?: EventLogScalarWhereWithAggregatesInput[]
    NOT?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"EventLog"> | number
    matchId?: IntWithAggregatesFilter<"EventLog"> | number
    userId?: IntNullableWithAggregatesFilter<"EventLog"> | number | null
    timestamp?: DateTimeWithAggregatesFilter<"EventLog"> | Date | string
    type?: StringWithAggregatesFilter<"EventLog"> | string
    message?: StringWithAggregatesFilter<"EventLog"> | string
  }

  export type UserCreateInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserRoleCreateInput = {
    role: string
    user: UserCreateNestedOneWithoutRolesInput
  }

  export type UserRoleUncheckedCreateInput = {
    id?: number
    userId: number
    role: string
  }

  export type UserRoleUpdateInput = {
    role?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutRolesNestedInput
  }

  export type UserRoleUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
  }

  export type UserRoleCreateManyInput = {
    id?: number
    userId: number
    role: string
  }

  export type UserRoleUpdateManyMutationInput = {
    role?: StringFieldUpdateOperationsInput | string
  }

  export type UserRoleUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
  }

  export type MatchCreateInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    createdBy: UserCreateNestedOneWithoutCreatedMatchesInput
    players?: MatchPlayerCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerUncheckedCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    createdBy?: UserUpdateOneRequiredWithoutCreatedMatchesNestedInput
    players?: MatchPlayerUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type MatchCreateManyInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
  }

  export type MatchUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
  }

  export type MatchUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
  }

  export type MatchPlayerCreateInput = {
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
    match: MatchCreateNestedOneWithoutPlayersInput
    user: UserCreateNestedOneWithoutMatchPlayersInput
  }

  export type MatchPlayerUncheckedCreateInput = {
    id?: number
    matchId: number
    userId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type MatchPlayerUpdateInput = {
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    match?: MatchUpdateOneRequiredWithoutPlayersNestedInput
    user?: UserUpdateOneRequiredWithoutMatchPlayersNestedInput
  }

  export type MatchPlayerUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchPlayerCreateManyInput = {
    id?: number
    matchId: number
    userId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type MatchPlayerUpdateManyMutationInput = {
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchPlayerUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatCreateInput = {
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
    match: MatchCreateNestedOneWithoutPlayerStatsInput
    user?: UserCreateNestedOneWithoutPlayerStatsInput
  }

  export type PlayerStatUncheckedCreateInput = {
    id?: number
    matchId: number
    userId?: number | null
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type PlayerStatUpdateInput = {
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
    match?: MatchUpdateOneRequiredWithoutPlayerStatsNestedInput
    user?: UserUpdateOneWithoutPlayerStatsNestedInput
  }

  export type PlayerStatUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type PlayerStatCreateManyInput = {
    id?: number
    matchId: number
    userId?: number | null
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type PlayerStatUpdateManyMutationInput = {
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type PlayerStatUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type MmrChangeCreateInput = {
    before: number
    after: number
    change: number
    match: MatchCreateNestedOneWithoutMmrChangesInput
    user: UserCreateNestedOneWithoutMmrChangesInput
  }

  export type MmrChangeUncheckedCreateInput = {
    id?: number
    matchId: number
    userId: number
    before: number
    after: number
    change: number
  }

  export type MmrChangeUpdateInput = {
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
    match?: MatchUpdateOneRequiredWithoutMmrChangesNestedInput
    user?: UserUpdateOneRequiredWithoutMmrChangesNestedInput
  }

  export type MmrChangeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type MmrChangeCreateManyInput = {
    id?: number
    matchId: number
    userId: number
    before: number
    after: number
    change: number
  }

  export type MmrChangeUpdateManyMutationInput = {
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type MmrChangeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type EventLogCreateInput = {
    timestamp?: Date | string
    type: string
    message: string
    match: MatchCreateNestedOneWithoutEventLogsInput
    user?: UserCreateNestedOneWithoutEventLogsInput
  }

  export type EventLogUncheckedCreateInput = {
    id?: number
    matchId: number
    userId?: number | null
    timestamp?: Date | string
    type: string
    message: string
  }

  export type EventLogUpdateInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    match?: MatchUpdateOneRequiredWithoutEventLogsNestedInput
    user?: UserUpdateOneWithoutEventLogsNestedInput
  }

  export type EventLogUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogCreateManyInput = {
    id?: number
    matchId: number
    userId?: number | null
    timestamp?: Date | string
    type: string
    message: string
  }

  export type EventLogUpdateManyMutationInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserRoleListRelationFilter = {
    every?: UserRoleWhereInput
    some?: UserRoleWhereInput
    none?: UserRoleWhereInput
  }

  export type MatchListRelationFilter = {
    every?: MatchWhereInput
    some?: MatchWhereInput
    none?: MatchWhereInput
  }

  export type MatchPlayerListRelationFilter = {
    every?: MatchPlayerWhereInput
    some?: MatchPlayerWhereInput
    none?: MatchPlayerWhereInput
  }

  export type PlayerStatListRelationFilter = {
    every?: PlayerStatWhereInput
    some?: PlayerStatWhereInput
    none?: PlayerStatWhereInput
  }

  export type MmrChangeListRelationFilter = {
    every?: MmrChangeWhereInput
    some?: MmrChangeWhereInput
    none?: MmrChangeWhereInput
  }

  export type EventLogListRelationFilter = {
    every?: EventLogWhereInput
    some?: EventLogWhereInput
    none?: EventLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserRoleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MatchOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MatchPlayerOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PlayerStatOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MmrChangeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    bnetId?: SortOrder
    battletag?: SortOrder
    nickname?: SortOrder
    profilePicture?: SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
    isAdmin?: SortOrder
    isDummy?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    bnetId?: SortOrder
    battletag?: SortOrder
    nickname?: SortOrder
    profilePicture?: SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
    isAdmin?: SortOrder
    isDummy?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    bnetId?: SortOrder
    battletag?: SortOrder
    nickname?: SortOrder
    profilePicture?: SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
    isAdmin?: SortOrder
    isDummy?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    mmr?: SortOrder
    wins?: SortOrder
    losses?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UserRoleCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    role?: SortOrder
  }

  export type UserRoleAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type UserRoleMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    role?: SortOrder
  }

  export type UserRoleMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    role?: SortOrder
  }

  export type UserRoleSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type EnumMatchStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MatchStatus | EnumMatchStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MatchStatus[]
    notIn?: $Enums.MatchStatus[]
    not?: NestedEnumMatchStatusFilter<$PrismaModel> | $Enums.MatchStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type MatchCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    status?: SortOrder
    gameMode?: SortOrder
    maxPlayers?: SortOrder
    map?: SortOrder
    isPrivate?: SortOrder
    password?: SortOrder
    balanceType?: SortOrder
    isSimulation?: SortOrder
    originalMatchId?: SortOrder
    replayData?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    scheduledTime?: SortOrder
    winner?: SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
  }

  export type MatchAvgOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    maxPlayers?: SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
  }

  export type MatchMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    status?: SortOrder
    gameMode?: SortOrder
    maxPlayers?: SortOrder
    map?: SortOrder
    isPrivate?: SortOrder
    password?: SortOrder
    balanceType?: SortOrder
    isSimulation?: SortOrder
    originalMatchId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    scheduledTime?: SortOrder
    winner?: SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
  }

  export type MatchMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    status?: SortOrder
    gameMode?: SortOrder
    maxPlayers?: SortOrder
    map?: SortOrder
    isPrivate?: SortOrder
    password?: SortOrder
    balanceType?: SortOrder
    isSimulation?: SortOrder
    originalMatchId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    scheduledTime?: SortOrder
    winner?: SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
  }

  export type MatchSumOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    maxPlayers?: SortOrder
    blueScore?: SortOrder
    redScore?: SortOrder
    duration?: SortOrder
  }

  export type EnumMatchStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MatchStatus | EnumMatchStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MatchStatus[]
    notIn?: $Enums.MatchStatus[]
    not?: NestedEnumMatchStatusWithAggregatesFilter<$PrismaModel> | $Enums.MatchStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMatchStatusFilter<$PrismaModel>
    _max?: NestedEnumMatchStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumTeamFilter<$PrismaModel = never> = {
    equals?: $Enums.Team | EnumTeamFieldRefInput<$PrismaModel>
    in?: $Enums.Team[]
    notIn?: $Enums.Team[]
    not?: NestedEnumTeamFilter<$PrismaModel> | $Enums.Team
  }

  export type MatchScalarRelationFilter = {
    is?: MatchWhereInput
    isNot?: MatchWhereInput
  }

  export type MatchPlayerMatchIdUserIdCompoundUniqueInput = {
    matchId: number
    userId: number
  }

  export type MatchPlayerCountOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    team?: SortOrder
    role?: SortOrder
    hero?: SortOrder
    joinedAt?: SortOrder
  }

  export type MatchPlayerAvgOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
  }

  export type MatchPlayerMaxOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    team?: SortOrder
    role?: SortOrder
    hero?: SortOrder
    joinedAt?: SortOrder
  }

  export type MatchPlayerMinOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    team?: SortOrder
    role?: SortOrder
    hero?: SortOrder
    joinedAt?: SortOrder
  }

  export type MatchPlayerSumOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
  }

  export type EnumTeamWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Team | EnumTeamFieldRefInput<$PrismaModel>
    in?: $Enums.Team[]
    notIn?: $Enums.Team[]
    not?: NestedEnumTeamWithAggregatesFilter<$PrismaModel> | $Enums.Team
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTeamFilter<$PrismaModel>
    _max?: NestedEnumTeamFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type PlayerStatCountOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    userIdString?: SortOrder
    battletag?: SortOrder
    team?: SortOrder
    hero?: SortOrder
    kills?: SortOrder
    deaths?: SortOrder
    assists?: SortOrder
    heroDamage?: SortOrder
    siegeDamage?: SortOrder
    healing?: SortOrder
    experienceContribution?: SortOrder
    mmrBefore?: SortOrder
    mmrAfter?: SortOrder
    mmrChange?: SortOrder
  }

  export type PlayerStatAvgOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    kills?: SortOrder
    deaths?: SortOrder
    assists?: SortOrder
    heroDamage?: SortOrder
    siegeDamage?: SortOrder
    healing?: SortOrder
    experienceContribution?: SortOrder
    mmrBefore?: SortOrder
    mmrAfter?: SortOrder
    mmrChange?: SortOrder
  }

  export type PlayerStatMaxOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    userIdString?: SortOrder
    battletag?: SortOrder
    team?: SortOrder
    hero?: SortOrder
    kills?: SortOrder
    deaths?: SortOrder
    assists?: SortOrder
    heroDamage?: SortOrder
    siegeDamage?: SortOrder
    healing?: SortOrder
    experienceContribution?: SortOrder
    mmrBefore?: SortOrder
    mmrAfter?: SortOrder
    mmrChange?: SortOrder
  }

  export type PlayerStatMinOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    userIdString?: SortOrder
    battletag?: SortOrder
    team?: SortOrder
    hero?: SortOrder
    kills?: SortOrder
    deaths?: SortOrder
    assists?: SortOrder
    heroDamage?: SortOrder
    siegeDamage?: SortOrder
    healing?: SortOrder
    experienceContribution?: SortOrder
    mmrBefore?: SortOrder
    mmrAfter?: SortOrder
    mmrChange?: SortOrder
  }

  export type PlayerStatSumOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    kills?: SortOrder
    deaths?: SortOrder
    assists?: SortOrder
    heroDamage?: SortOrder
    siegeDamage?: SortOrder
    healing?: SortOrder
    experienceContribution?: SortOrder
    mmrBefore?: SortOrder
    mmrAfter?: SortOrder
    mmrChange?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type MmrChangeCountOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
  }

  export type MmrChangeAvgOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
  }

  export type MmrChangeMaxOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
  }

  export type MmrChangeMinOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
  }

  export type MmrChangeSumOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    before?: SortOrder
    after?: SortOrder
    change?: SortOrder
  }

  export type EventLogCountOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    timestamp?: SortOrder
    type?: SortOrder
    message?: SortOrder
  }

  export type EventLogAvgOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
  }

  export type EventLogMaxOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    timestamp?: SortOrder
    type?: SortOrder
    message?: SortOrder
  }

  export type EventLogMinOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
    timestamp?: SortOrder
    type?: SortOrder
    message?: SortOrder
  }

  export type EventLogSumOrderByAggregateInput = {
    id?: SortOrder
    matchId?: SortOrder
    userId?: SortOrder
  }

  export type UserRoleCreateNestedManyWithoutUserInput = {
    create?: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput> | UserRoleCreateWithoutUserInput[] | UserRoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRoleCreateOrConnectWithoutUserInput | UserRoleCreateOrConnectWithoutUserInput[]
    createMany?: UserRoleCreateManyUserInputEnvelope
    connect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
  }

  export type MatchCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput> | MatchCreateWithoutCreatedByInput[] | MatchUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutCreatedByInput | MatchCreateOrConnectWithoutCreatedByInput[]
    createMany?: MatchCreateManyCreatedByInputEnvelope
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
  }

  export type MatchPlayerCreateNestedManyWithoutUserInput = {
    create?: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput> | MatchPlayerCreateWithoutUserInput[] | MatchPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutUserInput | MatchPlayerCreateOrConnectWithoutUserInput[]
    createMany?: MatchPlayerCreateManyUserInputEnvelope
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
  }

  export type PlayerStatCreateNestedManyWithoutUserInput = {
    create?: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput> | PlayerStatCreateWithoutUserInput[] | PlayerStatUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutUserInput | PlayerStatCreateOrConnectWithoutUserInput[]
    createMany?: PlayerStatCreateManyUserInputEnvelope
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
  }

  export type MmrChangeCreateNestedManyWithoutUserInput = {
    create?: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput> | MmrChangeCreateWithoutUserInput[] | MmrChangeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutUserInput | MmrChangeCreateOrConnectWithoutUserInput[]
    createMany?: MmrChangeCreateManyUserInputEnvelope
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
  }

  export type EventLogCreateNestedManyWithoutUserInput = {
    create?: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput> | EventLogCreateWithoutUserInput[] | EventLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutUserInput | EventLogCreateOrConnectWithoutUserInput[]
    createMany?: EventLogCreateManyUserInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type UserRoleUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput> | UserRoleCreateWithoutUserInput[] | UserRoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRoleCreateOrConnectWithoutUserInput | UserRoleCreateOrConnectWithoutUserInput[]
    createMany?: UserRoleCreateManyUserInputEnvelope
    connect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
  }

  export type MatchUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput> | MatchCreateWithoutCreatedByInput[] | MatchUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutCreatedByInput | MatchCreateOrConnectWithoutCreatedByInput[]
    createMany?: MatchCreateManyCreatedByInputEnvelope
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
  }

  export type MatchPlayerUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput> | MatchPlayerCreateWithoutUserInput[] | MatchPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutUserInput | MatchPlayerCreateOrConnectWithoutUserInput[]
    createMany?: MatchPlayerCreateManyUserInputEnvelope
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
  }

  export type PlayerStatUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput> | PlayerStatCreateWithoutUserInput[] | PlayerStatUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutUserInput | PlayerStatCreateOrConnectWithoutUserInput[]
    createMany?: PlayerStatCreateManyUserInputEnvelope
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
  }

  export type MmrChangeUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput> | MmrChangeCreateWithoutUserInput[] | MmrChangeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutUserInput | MmrChangeCreateOrConnectWithoutUserInput[]
    createMany?: MmrChangeCreateManyUserInputEnvelope
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
  }

  export type EventLogUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput> | EventLogCreateWithoutUserInput[] | EventLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutUserInput | EventLogCreateOrConnectWithoutUserInput[]
    createMany?: EventLogCreateManyUserInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserRoleUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput> | UserRoleCreateWithoutUserInput[] | UserRoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRoleCreateOrConnectWithoutUserInput | UserRoleCreateOrConnectWithoutUserInput[]
    upsert?: UserRoleUpsertWithWhereUniqueWithoutUserInput | UserRoleUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserRoleCreateManyUserInputEnvelope
    set?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    disconnect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    delete?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    connect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    update?: UserRoleUpdateWithWhereUniqueWithoutUserInput | UserRoleUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserRoleUpdateManyWithWhereWithoutUserInput | UserRoleUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserRoleScalarWhereInput | UserRoleScalarWhereInput[]
  }

  export type MatchUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput> | MatchCreateWithoutCreatedByInput[] | MatchUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutCreatedByInput | MatchCreateOrConnectWithoutCreatedByInput[]
    upsert?: MatchUpsertWithWhereUniqueWithoutCreatedByInput | MatchUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: MatchCreateManyCreatedByInputEnvelope
    set?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    disconnect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    delete?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    update?: MatchUpdateWithWhereUniqueWithoutCreatedByInput | MatchUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: MatchUpdateManyWithWhereWithoutCreatedByInput | MatchUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: MatchScalarWhereInput | MatchScalarWhereInput[]
  }

  export type MatchPlayerUpdateManyWithoutUserNestedInput = {
    create?: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput> | MatchPlayerCreateWithoutUserInput[] | MatchPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutUserInput | MatchPlayerCreateOrConnectWithoutUserInput[]
    upsert?: MatchPlayerUpsertWithWhereUniqueWithoutUserInput | MatchPlayerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MatchPlayerCreateManyUserInputEnvelope
    set?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    disconnect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    delete?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    update?: MatchPlayerUpdateWithWhereUniqueWithoutUserInput | MatchPlayerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MatchPlayerUpdateManyWithWhereWithoutUserInput | MatchPlayerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
  }

  export type PlayerStatUpdateManyWithoutUserNestedInput = {
    create?: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput> | PlayerStatCreateWithoutUserInput[] | PlayerStatUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutUserInput | PlayerStatCreateOrConnectWithoutUserInput[]
    upsert?: PlayerStatUpsertWithWhereUniqueWithoutUserInput | PlayerStatUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PlayerStatCreateManyUserInputEnvelope
    set?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    disconnect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    delete?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    update?: PlayerStatUpdateWithWhereUniqueWithoutUserInput | PlayerStatUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PlayerStatUpdateManyWithWhereWithoutUserInput | PlayerStatUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
  }

  export type MmrChangeUpdateManyWithoutUserNestedInput = {
    create?: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput> | MmrChangeCreateWithoutUserInput[] | MmrChangeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutUserInput | MmrChangeCreateOrConnectWithoutUserInput[]
    upsert?: MmrChangeUpsertWithWhereUniqueWithoutUserInput | MmrChangeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MmrChangeCreateManyUserInputEnvelope
    set?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    disconnect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    delete?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    update?: MmrChangeUpdateWithWhereUniqueWithoutUserInput | MmrChangeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MmrChangeUpdateManyWithWhereWithoutUserInput | MmrChangeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
  }

  export type EventLogUpdateManyWithoutUserNestedInput = {
    create?: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput> | EventLogCreateWithoutUserInput[] | EventLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutUserInput | EventLogCreateOrConnectWithoutUserInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutUserInput | EventLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EventLogCreateManyUserInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutUserInput | EventLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutUserInput | EventLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type UserRoleUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput> | UserRoleCreateWithoutUserInput[] | UserRoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserRoleCreateOrConnectWithoutUserInput | UserRoleCreateOrConnectWithoutUserInput[]
    upsert?: UserRoleUpsertWithWhereUniqueWithoutUserInput | UserRoleUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserRoleCreateManyUserInputEnvelope
    set?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    disconnect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    delete?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    connect?: UserRoleWhereUniqueInput | UserRoleWhereUniqueInput[]
    update?: UserRoleUpdateWithWhereUniqueWithoutUserInput | UserRoleUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserRoleUpdateManyWithWhereWithoutUserInput | UserRoleUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserRoleScalarWhereInput | UserRoleScalarWhereInput[]
  }

  export type MatchUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput> | MatchCreateWithoutCreatedByInput[] | MatchUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutCreatedByInput | MatchCreateOrConnectWithoutCreatedByInput[]
    upsert?: MatchUpsertWithWhereUniqueWithoutCreatedByInput | MatchUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: MatchCreateManyCreatedByInputEnvelope
    set?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    disconnect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    delete?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    update?: MatchUpdateWithWhereUniqueWithoutCreatedByInput | MatchUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: MatchUpdateManyWithWhereWithoutCreatedByInput | MatchUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: MatchScalarWhereInput | MatchScalarWhereInput[]
  }

  export type MatchPlayerUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput> | MatchPlayerCreateWithoutUserInput[] | MatchPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutUserInput | MatchPlayerCreateOrConnectWithoutUserInput[]
    upsert?: MatchPlayerUpsertWithWhereUniqueWithoutUserInput | MatchPlayerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MatchPlayerCreateManyUserInputEnvelope
    set?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    disconnect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    delete?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    update?: MatchPlayerUpdateWithWhereUniqueWithoutUserInput | MatchPlayerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MatchPlayerUpdateManyWithWhereWithoutUserInput | MatchPlayerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
  }

  export type PlayerStatUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput> | PlayerStatCreateWithoutUserInput[] | PlayerStatUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutUserInput | PlayerStatCreateOrConnectWithoutUserInput[]
    upsert?: PlayerStatUpsertWithWhereUniqueWithoutUserInput | PlayerStatUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PlayerStatCreateManyUserInputEnvelope
    set?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    disconnect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    delete?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    update?: PlayerStatUpdateWithWhereUniqueWithoutUserInput | PlayerStatUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PlayerStatUpdateManyWithWhereWithoutUserInput | PlayerStatUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
  }

  export type MmrChangeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput> | MmrChangeCreateWithoutUserInput[] | MmrChangeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutUserInput | MmrChangeCreateOrConnectWithoutUserInput[]
    upsert?: MmrChangeUpsertWithWhereUniqueWithoutUserInput | MmrChangeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MmrChangeCreateManyUserInputEnvelope
    set?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    disconnect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    delete?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    update?: MmrChangeUpdateWithWhereUniqueWithoutUserInput | MmrChangeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MmrChangeUpdateManyWithWhereWithoutUserInput | MmrChangeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
  }

  export type EventLogUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput> | EventLogCreateWithoutUserInput[] | EventLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutUserInput | EventLogCreateOrConnectWithoutUserInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutUserInput | EventLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EventLogCreateManyUserInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutUserInput | EventLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutUserInput | EventLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRolesInput = {
    create?: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRolesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRolesNestedInput = {
    create?: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRolesInput
    upsert?: UserUpsertWithoutRolesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRolesInput, UserUpdateWithoutRolesInput>, UserUncheckedUpdateWithoutRolesInput>
  }

  export type UserCreateNestedOneWithoutCreatedMatchesInput = {
    create?: XOR<UserCreateWithoutCreatedMatchesInput, UserUncheckedCreateWithoutCreatedMatchesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedMatchesInput
    connect?: UserWhereUniqueInput
  }

  export type MatchPlayerCreateNestedManyWithoutMatchInput = {
    create?: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput> | MatchPlayerCreateWithoutMatchInput[] | MatchPlayerUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutMatchInput | MatchPlayerCreateOrConnectWithoutMatchInput[]
    createMany?: MatchPlayerCreateManyMatchInputEnvelope
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
  }

  export type PlayerStatCreateNestedManyWithoutMatchInput = {
    create?: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput> | PlayerStatCreateWithoutMatchInput[] | PlayerStatUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutMatchInput | PlayerStatCreateOrConnectWithoutMatchInput[]
    createMany?: PlayerStatCreateManyMatchInputEnvelope
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
  }

  export type MmrChangeCreateNestedManyWithoutMatchInput = {
    create?: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput> | MmrChangeCreateWithoutMatchInput[] | MmrChangeUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutMatchInput | MmrChangeCreateOrConnectWithoutMatchInput[]
    createMany?: MmrChangeCreateManyMatchInputEnvelope
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
  }

  export type EventLogCreateNestedManyWithoutMatchInput = {
    create?: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput> | EventLogCreateWithoutMatchInput[] | EventLogUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutMatchInput | EventLogCreateOrConnectWithoutMatchInput[]
    createMany?: EventLogCreateManyMatchInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type MatchPlayerUncheckedCreateNestedManyWithoutMatchInput = {
    create?: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput> | MatchPlayerCreateWithoutMatchInput[] | MatchPlayerUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutMatchInput | MatchPlayerCreateOrConnectWithoutMatchInput[]
    createMany?: MatchPlayerCreateManyMatchInputEnvelope
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
  }

  export type PlayerStatUncheckedCreateNestedManyWithoutMatchInput = {
    create?: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput> | PlayerStatCreateWithoutMatchInput[] | PlayerStatUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutMatchInput | PlayerStatCreateOrConnectWithoutMatchInput[]
    createMany?: PlayerStatCreateManyMatchInputEnvelope
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
  }

  export type MmrChangeUncheckedCreateNestedManyWithoutMatchInput = {
    create?: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput> | MmrChangeCreateWithoutMatchInput[] | MmrChangeUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutMatchInput | MmrChangeCreateOrConnectWithoutMatchInput[]
    createMany?: MmrChangeCreateManyMatchInputEnvelope
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
  }

  export type EventLogUncheckedCreateNestedManyWithoutMatchInput = {
    create?: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput> | EventLogCreateWithoutMatchInput[] | EventLogUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutMatchInput | EventLogCreateOrConnectWithoutMatchInput[]
    createMany?: EventLogCreateManyMatchInputEnvelope
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
  }

  export type EnumMatchStatusFieldUpdateOperationsInput = {
    set?: $Enums.MatchStatus
  }

  export type UserUpdateOneRequiredWithoutCreatedMatchesNestedInput = {
    create?: XOR<UserCreateWithoutCreatedMatchesInput, UserUncheckedCreateWithoutCreatedMatchesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedMatchesInput
    upsert?: UserUpsertWithoutCreatedMatchesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCreatedMatchesInput, UserUpdateWithoutCreatedMatchesInput>, UserUncheckedUpdateWithoutCreatedMatchesInput>
  }

  export type MatchPlayerUpdateManyWithoutMatchNestedInput = {
    create?: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput> | MatchPlayerCreateWithoutMatchInput[] | MatchPlayerUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutMatchInput | MatchPlayerCreateOrConnectWithoutMatchInput[]
    upsert?: MatchPlayerUpsertWithWhereUniqueWithoutMatchInput | MatchPlayerUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: MatchPlayerCreateManyMatchInputEnvelope
    set?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    disconnect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    delete?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    update?: MatchPlayerUpdateWithWhereUniqueWithoutMatchInput | MatchPlayerUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: MatchPlayerUpdateManyWithWhereWithoutMatchInput | MatchPlayerUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
  }

  export type PlayerStatUpdateManyWithoutMatchNestedInput = {
    create?: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput> | PlayerStatCreateWithoutMatchInput[] | PlayerStatUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutMatchInput | PlayerStatCreateOrConnectWithoutMatchInput[]
    upsert?: PlayerStatUpsertWithWhereUniqueWithoutMatchInput | PlayerStatUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: PlayerStatCreateManyMatchInputEnvelope
    set?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    disconnect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    delete?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    update?: PlayerStatUpdateWithWhereUniqueWithoutMatchInput | PlayerStatUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: PlayerStatUpdateManyWithWhereWithoutMatchInput | PlayerStatUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
  }

  export type MmrChangeUpdateManyWithoutMatchNestedInput = {
    create?: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput> | MmrChangeCreateWithoutMatchInput[] | MmrChangeUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutMatchInput | MmrChangeCreateOrConnectWithoutMatchInput[]
    upsert?: MmrChangeUpsertWithWhereUniqueWithoutMatchInput | MmrChangeUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: MmrChangeCreateManyMatchInputEnvelope
    set?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    disconnect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    delete?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    update?: MmrChangeUpdateWithWhereUniqueWithoutMatchInput | MmrChangeUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: MmrChangeUpdateManyWithWhereWithoutMatchInput | MmrChangeUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
  }

  export type EventLogUpdateManyWithoutMatchNestedInput = {
    create?: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput> | EventLogCreateWithoutMatchInput[] | EventLogUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutMatchInput | EventLogCreateOrConnectWithoutMatchInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutMatchInput | EventLogUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: EventLogCreateManyMatchInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutMatchInput | EventLogUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutMatchInput | EventLogUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput = {
    create?: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput> | MatchPlayerCreateWithoutMatchInput[] | MatchPlayerUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MatchPlayerCreateOrConnectWithoutMatchInput | MatchPlayerCreateOrConnectWithoutMatchInput[]
    upsert?: MatchPlayerUpsertWithWhereUniqueWithoutMatchInput | MatchPlayerUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: MatchPlayerCreateManyMatchInputEnvelope
    set?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    disconnect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    delete?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    connect?: MatchPlayerWhereUniqueInput | MatchPlayerWhereUniqueInput[]
    update?: MatchPlayerUpdateWithWhereUniqueWithoutMatchInput | MatchPlayerUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: MatchPlayerUpdateManyWithWhereWithoutMatchInput | MatchPlayerUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
  }

  export type PlayerStatUncheckedUpdateManyWithoutMatchNestedInput = {
    create?: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput> | PlayerStatCreateWithoutMatchInput[] | PlayerStatUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: PlayerStatCreateOrConnectWithoutMatchInput | PlayerStatCreateOrConnectWithoutMatchInput[]
    upsert?: PlayerStatUpsertWithWhereUniqueWithoutMatchInput | PlayerStatUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: PlayerStatCreateManyMatchInputEnvelope
    set?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    disconnect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    delete?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    connect?: PlayerStatWhereUniqueInput | PlayerStatWhereUniqueInput[]
    update?: PlayerStatUpdateWithWhereUniqueWithoutMatchInput | PlayerStatUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: PlayerStatUpdateManyWithWhereWithoutMatchInput | PlayerStatUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
  }

  export type MmrChangeUncheckedUpdateManyWithoutMatchNestedInput = {
    create?: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput> | MmrChangeCreateWithoutMatchInput[] | MmrChangeUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: MmrChangeCreateOrConnectWithoutMatchInput | MmrChangeCreateOrConnectWithoutMatchInput[]
    upsert?: MmrChangeUpsertWithWhereUniqueWithoutMatchInput | MmrChangeUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: MmrChangeCreateManyMatchInputEnvelope
    set?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    disconnect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    delete?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    connect?: MmrChangeWhereUniqueInput | MmrChangeWhereUniqueInput[]
    update?: MmrChangeUpdateWithWhereUniqueWithoutMatchInput | MmrChangeUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: MmrChangeUpdateManyWithWhereWithoutMatchInput | MmrChangeUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
  }

  export type EventLogUncheckedUpdateManyWithoutMatchNestedInput = {
    create?: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput> | EventLogCreateWithoutMatchInput[] | EventLogUncheckedCreateWithoutMatchInput[]
    connectOrCreate?: EventLogCreateOrConnectWithoutMatchInput | EventLogCreateOrConnectWithoutMatchInput[]
    upsert?: EventLogUpsertWithWhereUniqueWithoutMatchInput | EventLogUpsertWithWhereUniqueWithoutMatchInput[]
    createMany?: EventLogCreateManyMatchInputEnvelope
    set?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    disconnect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    delete?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    connect?: EventLogWhereUniqueInput | EventLogWhereUniqueInput[]
    update?: EventLogUpdateWithWhereUniqueWithoutMatchInput | EventLogUpdateWithWhereUniqueWithoutMatchInput[]
    updateMany?: EventLogUpdateManyWithWhereWithoutMatchInput | EventLogUpdateManyWithWhereWithoutMatchInput[]
    deleteMany?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
  }

  export type MatchCreateNestedOneWithoutPlayersInput = {
    create?: XOR<MatchCreateWithoutPlayersInput, MatchUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: MatchCreateOrConnectWithoutPlayersInput
    connect?: MatchWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutMatchPlayersInput = {
    create?: XOR<UserCreateWithoutMatchPlayersInput, UserUncheckedCreateWithoutMatchPlayersInput>
    connectOrCreate?: UserCreateOrConnectWithoutMatchPlayersInput
    connect?: UserWhereUniqueInput
  }

  export type EnumTeamFieldUpdateOperationsInput = {
    set?: $Enums.Team
  }

  export type MatchUpdateOneRequiredWithoutPlayersNestedInput = {
    create?: XOR<MatchCreateWithoutPlayersInput, MatchUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: MatchCreateOrConnectWithoutPlayersInput
    upsert?: MatchUpsertWithoutPlayersInput
    connect?: MatchWhereUniqueInput
    update?: XOR<XOR<MatchUpdateToOneWithWhereWithoutPlayersInput, MatchUpdateWithoutPlayersInput>, MatchUncheckedUpdateWithoutPlayersInput>
  }

  export type UserUpdateOneRequiredWithoutMatchPlayersNestedInput = {
    create?: XOR<UserCreateWithoutMatchPlayersInput, UserUncheckedCreateWithoutMatchPlayersInput>
    connectOrCreate?: UserCreateOrConnectWithoutMatchPlayersInput
    upsert?: UserUpsertWithoutMatchPlayersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMatchPlayersInput, UserUpdateWithoutMatchPlayersInput>, UserUncheckedUpdateWithoutMatchPlayersInput>
  }

  export type MatchCreateNestedOneWithoutPlayerStatsInput = {
    create?: XOR<MatchCreateWithoutPlayerStatsInput, MatchUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: MatchCreateOrConnectWithoutPlayerStatsInput
    connect?: MatchWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutPlayerStatsInput = {
    create?: XOR<UserCreateWithoutPlayerStatsInput, UserUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPlayerStatsInput
    connect?: UserWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MatchUpdateOneRequiredWithoutPlayerStatsNestedInput = {
    create?: XOR<MatchCreateWithoutPlayerStatsInput, MatchUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: MatchCreateOrConnectWithoutPlayerStatsInput
    upsert?: MatchUpsertWithoutPlayerStatsInput
    connect?: MatchWhereUniqueInput
    update?: XOR<XOR<MatchUpdateToOneWithWhereWithoutPlayerStatsInput, MatchUpdateWithoutPlayerStatsInput>, MatchUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type UserUpdateOneWithoutPlayerStatsNestedInput = {
    create?: XOR<UserCreateWithoutPlayerStatsInput, UserUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPlayerStatsInput
    upsert?: UserUpsertWithoutPlayerStatsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPlayerStatsInput, UserUpdateWithoutPlayerStatsInput>, UserUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type MatchCreateNestedOneWithoutMmrChangesInput = {
    create?: XOR<MatchCreateWithoutMmrChangesInput, MatchUncheckedCreateWithoutMmrChangesInput>
    connectOrCreate?: MatchCreateOrConnectWithoutMmrChangesInput
    connect?: MatchWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutMmrChangesInput = {
    create?: XOR<UserCreateWithoutMmrChangesInput, UserUncheckedCreateWithoutMmrChangesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMmrChangesInput
    connect?: UserWhereUniqueInput
  }

  export type MatchUpdateOneRequiredWithoutMmrChangesNestedInput = {
    create?: XOR<MatchCreateWithoutMmrChangesInput, MatchUncheckedCreateWithoutMmrChangesInput>
    connectOrCreate?: MatchCreateOrConnectWithoutMmrChangesInput
    upsert?: MatchUpsertWithoutMmrChangesInput
    connect?: MatchWhereUniqueInput
    update?: XOR<XOR<MatchUpdateToOneWithWhereWithoutMmrChangesInput, MatchUpdateWithoutMmrChangesInput>, MatchUncheckedUpdateWithoutMmrChangesInput>
  }

  export type UserUpdateOneRequiredWithoutMmrChangesNestedInput = {
    create?: XOR<UserCreateWithoutMmrChangesInput, UserUncheckedCreateWithoutMmrChangesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMmrChangesInput
    upsert?: UserUpsertWithoutMmrChangesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMmrChangesInput, UserUpdateWithoutMmrChangesInput>, UserUncheckedUpdateWithoutMmrChangesInput>
  }

  export type MatchCreateNestedOneWithoutEventLogsInput = {
    create?: XOR<MatchCreateWithoutEventLogsInput, MatchUncheckedCreateWithoutEventLogsInput>
    connectOrCreate?: MatchCreateOrConnectWithoutEventLogsInput
    connect?: MatchWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutEventLogsInput = {
    create?: XOR<UserCreateWithoutEventLogsInput, UserUncheckedCreateWithoutEventLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEventLogsInput
    connect?: UserWhereUniqueInput
  }

  export type MatchUpdateOneRequiredWithoutEventLogsNestedInput = {
    create?: XOR<MatchCreateWithoutEventLogsInput, MatchUncheckedCreateWithoutEventLogsInput>
    connectOrCreate?: MatchCreateOrConnectWithoutEventLogsInput
    upsert?: MatchUpsertWithoutEventLogsInput
    connect?: MatchWhereUniqueInput
    update?: XOR<XOR<MatchUpdateToOneWithWhereWithoutEventLogsInput, MatchUpdateWithoutEventLogsInput>, MatchUncheckedUpdateWithoutEventLogsInput>
  }

  export type UserUpdateOneWithoutEventLogsNestedInput = {
    create?: XOR<UserCreateWithoutEventLogsInput, UserUncheckedCreateWithoutEventLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEventLogsInput
    upsert?: UserUpsertWithoutEventLogsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEventLogsInput, UserUpdateWithoutEventLogsInput>, UserUncheckedUpdateWithoutEventLogsInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumMatchStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MatchStatus | EnumMatchStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MatchStatus[]
    notIn?: $Enums.MatchStatus[]
    not?: NestedEnumMatchStatusFilter<$PrismaModel> | $Enums.MatchStatus
  }

  export type NestedEnumMatchStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MatchStatus | EnumMatchStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MatchStatus[]
    notIn?: $Enums.MatchStatus[]
    not?: NestedEnumMatchStatusWithAggregatesFilter<$PrismaModel> | $Enums.MatchStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMatchStatusFilter<$PrismaModel>
    _max?: NestedEnumMatchStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumTeamFilter<$PrismaModel = never> = {
    equals?: $Enums.Team | EnumTeamFieldRefInput<$PrismaModel>
    in?: $Enums.Team[]
    notIn?: $Enums.Team[]
    not?: NestedEnumTeamFilter<$PrismaModel> | $Enums.Team
  }

  export type NestedEnumTeamWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Team | EnumTeamFieldRefInput<$PrismaModel>
    in?: $Enums.Team[]
    notIn?: $Enums.Team[]
    not?: NestedEnumTeamWithAggregatesFilter<$PrismaModel> | $Enums.Team
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTeamFilter<$PrismaModel>
    _max?: NestedEnumTeamFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type UserRoleCreateWithoutUserInput = {
    role: string
  }

  export type UserRoleUncheckedCreateWithoutUserInput = {
    id?: number
    role: string
  }

  export type UserRoleCreateOrConnectWithoutUserInput = {
    where: UserRoleWhereUniqueInput
    create: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput>
  }

  export type UserRoleCreateManyUserInputEnvelope = {
    data: UserRoleCreateManyUserInput | UserRoleCreateManyUserInput[]
  }

  export type MatchCreateWithoutCreatedByInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateWithoutCreatedByInput = {
    id?: number
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerUncheckedCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchCreateOrConnectWithoutCreatedByInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput>
  }

  export type MatchCreateManyCreatedByInputEnvelope = {
    data: MatchCreateManyCreatedByInput | MatchCreateManyCreatedByInput[]
  }

  export type MatchPlayerCreateWithoutUserInput = {
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
    match: MatchCreateNestedOneWithoutPlayersInput
  }

  export type MatchPlayerUncheckedCreateWithoutUserInput = {
    id?: number
    matchId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type MatchPlayerCreateOrConnectWithoutUserInput = {
    where: MatchPlayerWhereUniqueInput
    create: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput>
  }

  export type MatchPlayerCreateManyUserInputEnvelope = {
    data: MatchPlayerCreateManyUserInput | MatchPlayerCreateManyUserInput[]
  }

  export type PlayerStatCreateWithoutUserInput = {
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
    match: MatchCreateNestedOneWithoutPlayerStatsInput
  }

  export type PlayerStatUncheckedCreateWithoutUserInput = {
    id?: number
    matchId: number
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type PlayerStatCreateOrConnectWithoutUserInput = {
    where: PlayerStatWhereUniqueInput
    create: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput>
  }

  export type PlayerStatCreateManyUserInputEnvelope = {
    data: PlayerStatCreateManyUserInput | PlayerStatCreateManyUserInput[]
  }

  export type MmrChangeCreateWithoutUserInput = {
    before: number
    after: number
    change: number
    match: MatchCreateNestedOneWithoutMmrChangesInput
  }

  export type MmrChangeUncheckedCreateWithoutUserInput = {
    id?: number
    matchId: number
    before: number
    after: number
    change: number
  }

  export type MmrChangeCreateOrConnectWithoutUserInput = {
    where: MmrChangeWhereUniqueInput
    create: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput>
  }

  export type MmrChangeCreateManyUserInputEnvelope = {
    data: MmrChangeCreateManyUserInput | MmrChangeCreateManyUserInput[]
  }

  export type EventLogCreateWithoutUserInput = {
    timestamp?: Date | string
    type: string
    message: string
    match: MatchCreateNestedOneWithoutEventLogsInput
  }

  export type EventLogUncheckedCreateWithoutUserInput = {
    id?: number
    matchId: number
    timestamp?: Date | string
    type: string
    message: string
  }

  export type EventLogCreateOrConnectWithoutUserInput = {
    where: EventLogWhereUniqueInput
    create: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput>
  }

  export type EventLogCreateManyUserInputEnvelope = {
    data: EventLogCreateManyUserInput | EventLogCreateManyUserInput[]
  }

  export type UserRoleUpsertWithWhereUniqueWithoutUserInput = {
    where: UserRoleWhereUniqueInput
    update: XOR<UserRoleUpdateWithoutUserInput, UserRoleUncheckedUpdateWithoutUserInput>
    create: XOR<UserRoleCreateWithoutUserInput, UserRoleUncheckedCreateWithoutUserInput>
  }

  export type UserRoleUpdateWithWhereUniqueWithoutUserInput = {
    where: UserRoleWhereUniqueInput
    data: XOR<UserRoleUpdateWithoutUserInput, UserRoleUncheckedUpdateWithoutUserInput>
  }

  export type UserRoleUpdateManyWithWhereWithoutUserInput = {
    where: UserRoleScalarWhereInput
    data: XOR<UserRoleUpdateManyMutationInput, UserRoleUncheckedUpdateManyWithoutUserInput>
  }

  export type UserRoleScalarWhereInput = {
    AND?: UserRoleScalarWhereInput | UserRoleScalarWhereInput[]
    OR?: UserRoleScalarWhereInput[]
    NOT?: UserRoleScalarWhereInput | UserRoleScalarWhereInput[]
    id?: IntFilter<"UserRole"> | number
    userId?: IntFilter<"UserRole"> | number
    role?: StringFilter<"UserRole"> | string
  }

  export type MatchUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: MatchWhereUniqueInput
    update: XOR<MatchUpdateWithoutCreatedByInput, MatchUncheckedUpdateWithoutCreatedByInput>
    create: XOR<MatchCreateWithoutCreatedByInput, MatchUncheckedCreateWithoutCreatedByInput>
  }

  export type MatchUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: MatchWhereUniqueInput
    data: XOR<MatchUpdateWithoutCreatedByInput, MatchUncheckedUpdateWithoutCreatedByInput>
  }

  export type MatchUpdateManyWithWhereWithoutCreatedByInput = {
    where: MatchScalarWhereInput
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type MatchScalarWhereInput = {
    AND?: MatchScalarWhereInput | MatchScalarWhereInput[]
    OR?: MatchScalarWhereInput[]
    NOT?: MatchScalarWhereInput | MatchScalarWhereInput[]
    id?: IntFilter<"Match"> | number
    title?: StringFilter<"Match"> | string
    description?: StringNullableFilter<"Match"> | string | null
    createdById?: IntFilter<"Match"> | number
    status?: EnumMatchStatusFilter<"Match"> | $Enums.MatchStatus
    gameMode?: StringFilter<"Match"> | string
    maxPlayers?: IntFilter<"Match"> | number
    map?: StringNullableFilter<"Match"> | string | null
    isPrivate?: BoolFilter<"Match"> | boolean
    password?: StringNullableFilter<"Match"> | string | null
    balanceType?: StringFilter<"Match"> | string
    isSimulation?: BoolFilter<"Match"> | boolean
    originalMatchId?: StringNullableFilter<"Match"> | string | null
    replayData?: JsonNullableFilter<"Match">
    createdAt?: DateTimeFilter<"Match"> | Date | string
    updatedAt?: DateTimeFilter<"Match"> | Date | string
    scheduledTime?: DateTimeFilter<"Match"> | Date | string
    winner?: StringNullableFilter<"Match"> | string | null
    blueScore?: IntFilter<"Match"> | number
    redScore?: IntFilter<"Match"> | number
    duration?: IntFilter<"Match"> | number
  }

  export type MatchPlayerUpsertWithWhereUniqueWithoutUserInput = {
    where: MatchPlayerWhereUniqueInput
    update: XOR<MatchPlayerUpdateWithoutUserInput, MatchPlayerUncheckedUpdateWithoutUserInput>
    create: XOR<MatchPlayerCreateWithoutUserInput, MatchPlayerUncheckedCreateWithoutUserInput>
  }

  export type MatchPlayerUpdateWithWhereUniqueWithoutUserInput = {
    where: MatchPlayerWhereUniqueInput
    data: XOR<MatchPlayerUpdateWithoutUserInput, MatchPlayerUncheckedUpdateWithoutUserInput>
  }

  export type MatchPlayerUpdateManyWithWhereWithoutUserInput = {
    where: MatchPlayerScalarWhereInput
    data: XOR<MatchPlayerUpdateManyMutationInput, MatchPlayerUncheckedUpdateManyWithoutUserInput>
  }

  export type MatchPlayerScalarWhereInput = {
    AND?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
    OR?: MatchPlayerScalarWhereInput[]
    NOT?: MatchPlayerScalarWhereInput | MatchPlayerScalarWhereInput[]
    id?: IntFilter<"MatchPlayer"> | number
    matchId?: IntFilter<"MatchPlayer"> | number
    userId?: IntFilter<"MatchPlayer"> | number
    team?: EnumTeamFilter<"MatchPlayer"> | $Enums.Team
    role?: StringNullableFilter<"MatchPlayer"> | string | null
    hero?: StringNullableFilter<"MatchPlayer"> | string | null
    joinedAt?: DateTimeFilter<"MatchPlayer"> | Date | string
  }

  export type PlayerStatUpsertWithWhereUniqueWithoutUserInput = {
    where: PlayerStatWhereUniqueInput
    update: XOR<PlayerStatUpdateWithoutUserInput, PlayerStatUncheckedUpdateWithoutUserInput>
    create: XOR<PlayerStatCreateWithoutUserInput, PlayerStatUncheckedCreateWithoutUserInput>
  }

  export type PlayerStatUpdateWithWhereUniqueWithoutUserInput = {
    where: PlayerStatWhereUniqueInput
    data: XOR<PlayerStatUpdateWithoutUserInput, PlayerStatUncheckedUpdateWithoutUserInput>
  }

  export type PlayerStatUpdateManyWithWhereWithoutUserInput = {
    where: PlayerStatScalarWhereInput
    data: XOR<PlayerStatUpdateManyMutationInput, PlayerStatUncheckedUpdateManyWithoutUserInput>
  }

  export type PlayerStatScalarWhereInput = {
    AND?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
    OR?: PlayerStatScalarWhereInput[]
    NOT?: PlayerStatScalarWhereInput | PlayerStatScalarWhereInput[]
    id?: IntFilter<"PlayerStat"> | number
    matchId?: IntFilter<"PlayerStat"> | number
    userId?: IntNullableFilter<"PlayerStat"> | number | null
    userIdString?: StringNullableFilter<"PlayerStat"> | string | null
    battletag?: StringFilter<"PlayerStat"> | string
    team?: EnumTeamFilter<"PlayerStat"> | $Enums.Team
    hero?: StringNullableFilter<"PlayerStat"> | string | null
    kills?: IntNullableFilter<"PlayerStat"> | number | null
    deaths?: IntNullableFilter<"PlayerStat"> | number | null
    assists?: IntNullableFilter<"PlayerStat"> | number | null
    heroDamage?: IntNullableFilter<"PlayerStat"> | number | null
    siegeDamage?: IntNullableFilter<"PlayerStat"> | number | null
    healing?: IntNullableFilter<"PlayerStat"> | number | null
    experienceContribution?: IntNullableFilter<"PlayerStat"> | number | null
    mmrBefore?: IntNullableFilter<"PlayerStat"> | number | null
    mmrAfter?: IntNullableFilter<"PlayerStat"> | number | null
    mmrChange?: IntNullableFilter<"PlayerStat"> | number | null
  }

  export type MmrChangeUpsertWithWhereUniqueWithoutUserInput = {
    where: MmrChangeWhereUniqueInput
    update: XOR<MmrChangeUpdateWithoutUserInput, MmrChangeUncheckedUpdateWithoutUserInput>
    create: XOR<MmrChangeCreateWithoutUserInput, MmrChangeUncheckedCreateWithoutUserInput>
  }

  export type MmrChangeUpdateWithWhereUniqueWithoutUserInput = {
    where: MmrChangeWhereUniqueInput
    data: XOR<MmrChangeUpdateWithoutUserInput, MmrChangeUncheckedUpdateWithoutUserInput>
  }

  export type MmrChangeUpdateManyWithWhereWithoutUserInput = {
    where: MmrChangeScalarWhereInput
    data: XOR<MmrChangeUpdateManyMutationInput, MmrChangeUncheckedUpdateManyWithoutUserInput>
  }

  export type MmrChangeScalarWhereInput = {
    AND?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
    OR?: MmrChangeScalarWhereInput[]
    NOT?: MmrChangeScalarWhereInput | MmrChangeScalarWhereInput[]
    id?: IntFilter<"MmrChange"> | number
    matchId?: IntFilter<"MmrChange"> | number
    userId?: IntFilter<"MmrChange"> | number
    before?: IntFilter<"MmrChange"> | number
    after?: IntFilter<"MmrChange"> | number
    change?: IntFilter<"MmrChange"> | number
  }

  export type EventLogUpsertWithWhereUniqueWithoutUserInput = {
    where: EventLogWhereUniqueInput
    update: XOR<EventLogUpdateWithoutUserInput, EventLogUncheckedUpdateWithoutUserInput>
    create: XOR<EventLogCreateWithoutUserInput, EventLogUncheckedCreateWithoutUserInput>
  }

  export type EventLogUpdateWithWhereUniqueWithoutUserInput = {
    where: EventLogWhereUniqueInput
    data: XOR<EventLogUpdateWithoutUserInput, EventLogUncheckedUpdateWithoutUserInput>
  }

  export type EventLogUpdateManyWithWhereWithoutUserInput = {
    where: EventLogScalarWhereInput
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyWithoutUserInput>
  }

  export type EventLogScalarWhereInput = {
    AND?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
    OR?: EventLogScalarWhereInput[]
    NOT?: EventLogScalarWhereInput | EventLogScalarWhereInput[]
    id?: IntFilter<"EventLog"> | number
    matchId?: IntFilter<"EventLog"> | number
    userId?: IntNullableFilter<"EventLog"> | number | null
    timestamp?: DateTimeFilter<"EventLog"> | Date | string
    type?: StringFilter<"EventLog"> | string
    message?: StringFilter<"EventLog"> | string
  }

  export type UserCreateWithoutRolesInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRolesInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRolesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
  }

  export type UserUpsertWithoutRolesInput = {
    update: XOR<UserUpdateWithoutRolesInput, UserUncheckedUpdateWithoutRolesInput>
    create: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRolesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRolesInput, UserUncheckedUpdateWithoutRolesInput>
  }

  export type UserUpdateWithoutRolesInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRolesInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutCreatedMatchesInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCreatedMatchesInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCreatedMatchesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCreatedMatchesInput, UserUncheckedCreateWithoutCreatedMatchesInput>
  }

  export type MatchPlayerCreateWithoutMatchInput = {
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
    user: UserCreateNestedOneWithoutMatchPlayersInput
  }

  export type MatchPlayerUncheckedCreateWithoutMatchInput = {
    id?: number
    userId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type MatchPlayerCreateOrConnectWithoutMatchInput = {
    where: MatchPlayerWhereUniqueInput
    create: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput>
  }

  export type MatchPlayerCreateManyMatchInputEnvelope = {
    data: MatchPlayerCreateManyMatchInput | MatchPlayerCreateManyMatchInput[]
  }

  export type PlayerStatCreateWithoutMatchInput = {
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
    user?: UserCreateNestedOneWithoutPlayerStatsInput
  }

  export type PlayerStatUncheckedCreateWithoutMatchInput = {
    id?: number
    userId?: number | null
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type PlayerStatCreateOrConnectWithoutMatchInput = {
    where: PlayerStatWhereUniqueInput
    create: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput>
  }

  export type PlayerStatCreateManyMatchInputEnvelope = {
    data: PlayerStatCreateManyMatchInput | PlayerStatCreateManyMatchInput[]
  }

  export type MmrChangeCreateWithoutMatchInput = {
    before: number
    after: number
    change: number
    user: UserCreateNestedOneWithoutMmrChangesInput
  }

  export type MmrChangeUncheckedCreateWithoutMatchInput = {
    id?: number
    userId: number
    before: number
    after: number
    change: number
  }

  export type MmrChangeCreateOrConnectWithoutMatchInput = {
    where: MmrChangeWhereUniqueInput
    create: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput>
  }

  export type MmrChangeCreateManyMatchInputEnvelope = {
    data: MmrChangeCreateManyMatchInput | MmrChangeCreateManyMatchInput[]
  }

  export type EventLogCreateWithoutMatchInput = {
    timestamp?: Date | string
    type: string
    message: string
    user?: UserCreateNestedOneWithoutEventLogsInput
  }

  export type EventLogUncheckedCreateWithoutMatchInput = {
    id?: number
    userId?: number | null
    timestamp?: Date | string
    type: string
    message: string
  }

  export type EventLogCreateOrConnectWithoutMatchInput = {
    where: EventLogWhereUniqueInput
    create: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput>
  }

  export type EventLogCreateManyMatchInputEnvelope = {
    data: EventLogCreateManyMatchInput | EventLogCreateManyMatchInput[]
  }

  export type UserUpsertWithoutCreatedMatchesInput = {
    update: XOR<UserUpdateWithoutCreatedMatchesInput, UserUncheckedUpdateWithoutCreatedMatchesInput>
    create: XOR<UserCreateWithoutCreatedMatchesInput, UserUncheckedCreateWithoutCreatedMatchesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCreatedMatchesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCreatedMatchesInput, UserUncheckedUpdateWithoutCreatedMatchesInput>
  }

  export type UserUpdateWithoutCreatedMatchesInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCreatedMatchesInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MatchPlayerUpsertWithWhereUniqueWithoutMatchInput = {
    where: MatchPlayerWhereUniqueInput
    update: XOR<MatchPlayerUpdateWithoutMatchInput, MatchPlayerUncheckedUpdateWithoutMatchInput>
    create: XOR<MatchPlayerCreateWithoutMatchInput, MatchPlayerUncheckedCreateWithoutMatchInput>
  }

  export type MatchPlayerUpdateWithWhereUniqueWithoutMatchInput = {
    where: MatchPlayerWhereUniqueInput
    data: XOR<MatchPlayerUpdateWithoutMatchInput, MatchPlayerUncheckedUpdateWithoutMatchInput>
  }

  export type MatchPlayerUpdateManyWithWhereWithoutMatchInput = {
    where: MatchPlayerScalarWhereInput
    data: XOR<MatchPlayerUpdateManyMutationInput, MatchPlayerUncheckedUpdateManyWithoutMatchInput>
  }

  export type PlayerStatUpsertWithWhereUniqueWithoutMatchInput = {
    where: PlayerStatWhereUniqueInput
    update: XOR<PlayerStatUpdateWithoutMatchInput, PlayerStatUncheckedUpdateWithoutMatchInput>
    create: XOR<PlayerStatCreateWithoutMatchInput, PlayerStatUncheckedCreateWithoutMatchInput>
  }

  export type PlayerStatUpdateWithWhereUniqueWithoutMatchInput = {
    where: PlayerStatWhereUniqueInput
    data: XOR<PlayerStatUpdateWithoutMatchInput, PlayerStatUncheckedUpdateWithoutMatchInput>
  }

  export type PlayerStatUpdateManyWithWhereWithoutMatchInput = {
    where: PlayerStatScalarWhereInput
    data: XOR<PlayerStatUpdateManyMutationInput, PlayerStatUncheckedUpdateManyWithoutMatchInput>
  }

  export type MmrChangeUpsertWithWhereUniqueWithoutMatchInput = {
    where: MmrChangeWhereUniqueInput
    update: XOR<MmrChangeUpdateWithoutMatchInput, MmrChangeUncheckedUpdateWithoutMatchInput>
    create: XOR<MmrChangeCreateWithoutMatchInput, MmrChangeUncheckedCreateWithoutMatchInput>
  }

  export type MmrChangeUpdateWithWhereUniqueWithoutMatchInput = {
    where: MmrChangeWhereUniqueInput
    data: XOR<MmrChangeUpdateWithoutMatchInput, MmrChangeUncheckedUpdateWithoutMatchInput>
  }

  export type MmrChangeUpdateManyWithWhereWithoutMatchInput = {
    where: MmrChangeScalarWhereInput
    data: XOR<MmrChangeUpdateManyMutationInput, MmrChangeUncheckedUpdateManyWithoutMatchInput>
  }

  export type EventLogUpsertWithWhereUniqueWithoutMatchInput = {
    where: EventLogWhereUniqueInput
    update: XOR<EventLogUpdateWithoutMatchInput, EventLogUncheckedUpdateWithoutMatchInput>
    create: XOR<EventLogCreateWithoutMatchInput, EventLogUncheckedCreateWithoutMatchInput>
  }

  export type EventLogUpdateWithWhereUniqueWithoutMatchInput = {
    where: EventLogWhereUniqueInput
    data: XOR<EventLogUpdateWithoutMatchInput, EventLogUncheckedUpdateWithoutMatchInput>
  }

  export type EventLogUpdateManyWithWhereWithoutMatchInput = {
    where: EventLogScalarWhereInput
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyWithoutMatchInput>
  }

  export type MatchCreateWithoutPlayersInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    createdBy: UserCreateNestedOneWithoutCreatedMatchesInput
    playerStats?: PlayerStatCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateWithoutPlayersInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchCreateOrConnectWithoutPlayersInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutPlayersInput, MatchUncheckedCreateWithoutPlayersInput>
  }

  export type UserCreateWithoutMatchPlayersInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutMatchPlayersInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutMatchPlayersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMatchPlayersInput, UserUncheckedCreateWithoutMatchPlayersInput>
  }

  export type MatchUpsertWithoutPlayersInput = {
    update: XOR<MatchUpdateWithoutPlayersInput, MatchUncheckedUpdateWithoutPlayersInput>
    create: XOR<MatchCreateWithoutPlayersInput, MatchUncheckedCreateWithoutPlayersInput>
    where?: MatchWhereInput
  }

  export type MatchUpdateToOneWithWhereWithoutPlayersInput = {
    where?: MatchWhereInput
    data: XOR<MatchUpdateWithoutPlayersInput, MatchUncheckedUpdateWithoutPlayersInput>
  }

  export type MatchUpdateWithoutPlayersInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    createdBy?: UserUpdateOneRequiredWithoutCreatedMatchesNestedInput
    playerStats?: PlayerStatUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateWithoutPlayersInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    playerStats?: PlayerStatUncheckedUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type UserUpsertWithoutMatchPlayersInput = {
    update: XOR<UserUpdateWithoutMatchPlayersInput, UserUncheckedUpdateWithoutMatchPlayersInput>
    create: XOR<UserCreateWithoutMatchPlayersInput, UserUncheckedCreateWithoutMatchPlayersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMatchPlayersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMatchPlayersInput, UserUncheckedUpdateWithoutMatchPlayersInput>
  }

  export type UserUpdateWithoutMatchPlayersInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutMatchPlayersInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MatchCreateWithoutPlayerStatsInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    createdBy: UserCreateNestedOneWithoutCreatedMatchesInput
    players?: MatchPlayerCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateWithoutPlayerStatsInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerUncheckedCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchCreateOrConnectWithoutPlayerStatsInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutPlayerStatsInput, MatchUncheckedCreateWithoutPlayerStatsInput>
  }

  export type UserCreateWithoutPlayerStatsInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPlayerStatsInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPlayerStatsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPlayerStatsInput, UserUncheckedCreateWithoutPlayerStatsInput>
  }

  export type MatchUpsertWithoutPlayerStatsInput = {
    update: XOR<MatchUpdateWithoutPlayerStatsInput, MatchUncheckedUpdateWithoutPlayerStatsInput>
    create: XOR<MatchCreateWithoutPlayerStatsInput, MatchUncheckedCreateWithoutPlayerStatsInput>
    where?: MatchWhereInput
  }

  export type MatchUpdateToOneWithWhereWithoutPlayerStatsInput = {
    where?: MatchWhereInput
    data: XOR<MatchUpdateWithoutPlayerStatsInput, MatchUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type MatchUpdateWithoutPlayerStatsInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    createdBy?: UserUpdateOneRequiredWithoutCreatedMatchesNestedInput
    players?: MatchPlayerUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateWithoutPlayerStatsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type UserUpsertWithoutPlayerStatsInput = {
    update: XOR<UserUpdateWithoutPlayerStatsInput, UserUncheckedUpdateWithoutPlayerStatsInput>
    create: XOR<UserCreateWithoutPlayerStatsInput, UserUncheckedCreateWithoutPlayerStatsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPlayerStatsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPlayerStatsInput, UserUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type UserUpdateWithoutPlayerStatsInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPlayerStatsInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MatchCreateWithoutMmrChangesInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    createdBy: UserCreateNestedOneWithoutCreatedMatchesInput
    players?: MatchPlayerCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateWithoutMmrChangesInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerUncheckedCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutMatchInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchCreateOrConnectWithoutMmrChangesInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutMmrChangesInput, MatchUncheckedCreateWithoutMmrChangesInput>
  }

  export type UserCreateWithoutMmrChangesInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    eventLogs?: EventLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutMmrChangesInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    eventLogs?: EventLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutMmrChangesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMmrChangesInput, UserUncheckedCreateWithoutMmrChangesInput>
  }

  export type MatchUpsertWithoutMmrChangesInput = {
    update: XOR<MatchUpdateWithoutMmrChangesInput, MatchUncheckedUpdateWithoutMmrChangesInput>
    create: XOR<MatchCreateWithoutMmrChangesInput, MatchUncheckedCreateWithoutMmrChangesInput>
    where?: MatchWhereInput
  }

  export type MatchUpdateToOneWithWhereWithoutMmrChangesInput = {
    where?: MatchWhereInput
    data: XOR<MatchUpdateWithoutMmrChangesInput, MatchUncheckedUpdateWithoutMmrChangesInput>
  }

  export type MatchUpdateWithoutMmrChangesInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    createdBy?: UserUpdateOneRequiredWithoutCreatedMatchesNestedInput
    players?: MatchPlayerUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateWithoutMmrChangesInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type UserUpsertWithoutMmrChangesInput = {
    update: XOR<UserUpdateWithoutMmrChangesInput, UserUncheckedUpdateWithoutMmrChangesInput>
    create: XOR<UserCreateWithoutMmrChangesInput, UserUncheckedCreateWithoutMmrChangesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMmrChangesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMmrChangesInput, UserUncheckedUpdateWithoutMmrChangesInput>
  }

  export type UserUpdateWithoutMmrChangesInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutMmrChangesInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MatchCreateWithoutEventLogsInput = {
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    createdBy: UserCreateNestedOneWithoutCreatedMatchesInput
    players?: MatchPlayerCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutMatchInput
  }

  export type MatchUncheckedCreateWithoutEventLogsInput = {
    id?: number
    title: string
    description?: string | null
    createdById: number
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
    players?: MatchPlayerUncheckedCreateNestedManyWithoutMatchInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutMatchInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutMatchInput
  }

  export type MatchCreateOrConnectWithoutEventLogsInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutEventLogsInput, MatchUncheckedCreateWithoutEventLogsInput>
  }

  export type UserCreateWithoutEventLogsInput = {
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleCreateNestedManyWithoutUserInput
    createdMatches?: MatchCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutEventLogsInput = {
    id?: number
    bnetId: string
    battletag: string
    nickname: string
    profilePicture?: string | null
    mmr?: number
    wins?: number
    losses?: number
    isAdmin?: boolean
    isDummy?: boolean
    createdAt?: Date | string
    lastLogin?: Date | string
    roles?: UserRoleUncheckedCreateNestedManyWithoutUserInput
    createdMatches?: MatchUncheckedCreateNestedManyWithoutCreatedByInput
    matchPlayers?: MatchPlayerUncheckedCreateNestedManyWithoutUserInput
    playerStats?: PlayerStatUncheckedCreateNestedManyWithoutUserInput
    mmrChanges?: MmrChangeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutEventLogsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEventLogsInput, UserUncheckedCreateWithoutEventLogsInput>
  }

  export type MatchUpsertWithoutEventLogsInput = {
    update: XOR<MatchUpdateWithoutEventLogsInput, MatchUncheckedUpdateWithoutEventLogsInput>
    create: XOR<MatchCreateWithoutEventLogsInput, MatchUncheckedCreateWithoutEventLogsInput>
    where?: MatchWhereInput
  }

  export type MatchUpdateToOneWithWhereWithoutEventLogsInput = {
    where?: MatchWhereInput
    data: XOR<MatchUpdateWithoutEventLogsInput, MatchUncheckedUpdateWithoutEventLogsInput>
  }

  export type MatchUpdateWithoutEventLogsInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    createdBy?: UserUpdateOneRequiredWithoutCreatedMatchesNestedInput
    players?: MatchPlayerUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateWithoutEventLogsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: IntFieldUpdateOperationsInput | number
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type UserUpsertWithoutEventLogsInput = {
    update: XOR<UserUpdateWithoutEventLogsInput, UserUncheckedUpdateWithoutEventLogsInput>
    create: XOR<UserCreateWithoutEventLogsInput, UserUncheckedCreateWithoutEventLogsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEventLogsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEventLogsInput, UserUncheckedUpdateWithoutEventLogsInput>
  }

  export type UserUpdateWithoutEventLogsInput = {
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutEventLogsInput = {
    id?: IntFieldUpdateOperationsInput | number
    bnetId?: StringFieldUpdateOperationsInput | string
    battletag?: StringFieldUpdateOperationsInput | string
    nickname?: StringFieldUpdateOperationsInput | string
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    mmr?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    losses?: IntFieldUpdateOperationsInput | number
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isDummy?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: UserRoleUncheckedUpdateManyWithoutUserNestedInput
    createdMatches?: MatchUncheckedUpdateManyWithoutCreatedByNestedInput
    matchPlayers?: MatchPlayerUncheckedUpdateManyWithoutUserNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutUserNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserRoleCreateManyUserInput = {
    id?: number
    role: string
  }

  export type MatchCreateManyCreatedByInput = {
    id?: number
    title: string
    description?: string | null
    status?: $Enums.MatchStatus
    gameMode?: string
    maxPlayers?: number
    map?: string | null
    isPrivate?: boolean
    password?: string | null
    balanceType?: string
    isSimulation?: boolean
    originalMatchId?: string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    scheduledTime?: Date | string
    winner?: string | null
    blueScore?: number
    redScore?: number
    duration?: number
  }

  export type MatchPlayerCreateManyUserInput = {
    id?: number
    matchId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type PlayerStatCreateManyUserInput = {
    id?: number
    matchId: number
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type MmrChangeCreateManyUserInput = {
    id?: number
    matchId: number
    before: number
    after: number
    change: number
  }

  export type EventLogCreateManyUserInput = {
    id?: number
    matchId: number
    timestamp?: Date | string
    type: string
    message: string
  }

  export type UserRoleUpdateWithoutUserInput = {
    role?: StringFieldUpdateOperationsInput | string
  }

  export type UserRoleUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
  }

  export type UserRoleUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
  }

  export type MatchUpdateWithoutCreatedByInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
    players?: MatchPlayerUncheckedUpdateManyWithoutMatchNestedInput
    playerStats?: PlayerStatUncheckedUpdateManyWithoutMatchNestedInput
    mmrChanges?: MmrChangeUncheckedUpdateManyWithoutMatchNestedInput
    eventLogs?: EventLogUncheckedUpdateManyWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateManyWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMatchStatusFieldUpdateOperationsInput | $Enums.MatchStatus
    gameMode?: StringFieldUpdateOperationsInput | string
    maxPlayers?: IntFieldUpdateOperationsInput | number
    map?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    password?: NullableStringFieldUpdateOperationsInput | string | null
    balanceType?: StringFieldUpdateOperationsInput | string
    isSimulation?: BoolFieldUpdateOperationsInput | boolean
    originalMatchId?: NullableStringFieldUpdateOperationsInput | string | null
    replayData?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scheduledTime?: DateTimeFieldUpdateOperationsInput | Date | string
    winner?: NullableStringFieldUpdateOperationsInput | string | null
    blueScore?: IntFieldUpdateOperationsInput | number
    redScore?: IntFieldUpdateOperationsInput | number
    duration?: IntFieldUpdateOperationsInput | number
  }

  export type MatchPlayerUpdateWithoutUserInput = {
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    match?: MatchUpdateOneRequiredWithoutPlayersNestedInput
  }

  export type MatchPlayerUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchPlayerUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatUpdateWithoutUserInput = {
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
    match?: MatchUpdateOneRequiredWithoutPlayerStatsNestedInput
  }

  export type PlayerStatUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type PlayerStatUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type MmrChangeUpdateWithoutUserInput = {
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
    match?: MatchUpdateOneRequiredWithoutMmrChangesNestedInput
  }

  export type MmrChangeUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type MmrChangeUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type EventLogUpdateWithoutUserInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    match?: MatchUpdateOneRequiredWithoutEventLogsNestedInput
  }

  export type EventLogUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    matchId?: IntFieldUpdateOperationsInput | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type MatchPlayerCreateManyMatchInput = {
    id?: number
    userId: number
    team: $Enums.Team
    role?: string | null
    hero?: string | null
    joinedAt?: Date | string
  }

  export type PlayerStatCreateManyMatchInput = {
    id?: number
    userId?: number | null
    userIdString?: string | null
    battletag: string
    team: $Enums.Team
    hero?: string | null
    kills?: number | null
    deaths?: number | null
    assists?: number | null
    heroDamage?: number | null
    siegeDamage?: number | null
    healing?: number | null
    experienceContribution?: number | null
    mmrBefore?: number | null
    mmrAfter?: number | null
    mmrChange?: number | null
  }

  export type MmrChangeCreateManyMatchInput = {
    id?: number
    userId: number
    before: number
    after: number
    change: number
  }

  export type EventLogCreateManyMatchInput = {
    id?: number
    userId?: number | null
    timestamp?: Date | string
    type: string
    message: string
  }

  export type MatchPlayerUpdateWithoutMatchInput = {
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutMatchPlayersNestedInput
  }

  export type MatchPlayerUncheckedUpdateWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchPlayerUncheckedUpdateManyWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    role?: NullableStringFieldUpdateOperationsInput | string | null
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatUpdateWithoutMatchInput = {
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
    user?: UserUpdateOneWithoutPlayerStatsNestedInput
  }

  export type PlayerStatUncheckedUpdateWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type PlayerStatUncheckedUpdateManyWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    userIdString?: NullableStringFieldUpdateOperationsInput | string | null
    battletag?: StringFieldUpdateOperationsInput | string
    team?: EnumTeamFieldUpdateOperationsInput | $Enums.Team
    hero?: NullableStringFieldUpdateOperationsInput | string | null
    kills?: NullableIntFieldUpdateOperationsInput | number | null
    deaths?: NullableIntFieldUpdateOperationsInput | number | null
    assists?: NullableIntFieldUpdateOperationsInput | number | null
    heroDamage?: NullableIntFieldUpdateOperationsInput | number | null
    siegeDamage?: NullableIntFieldUpdateOperationsInput | number | null
    healing?: NullableIntFieldUpdateOperationsInput | number | null
    experienceContribution?: NullableIntFieldUpdateOperationsInput | number | null
    mmrBefore?: NullableIntFieldUpdateOperationsInput | number | null
    mmrAfter?: NullableIntFieldUpdateOperationsInput | number | null
    mmrChange?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type MmrChangeUpdateWithoutMatchInput = {
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
    user?: UserUpdateOneRequiredWithoutMmrChangesNestedInput
  }

  export type MmrChangeUncheckedUpdateWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type MmrChangeUncheckedUpdateManyWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    before?: IntFieldUpdateOperationsInput | number
    after?: IntFieldUpdateOperationsInput | number
    change?: IntFieldUpdateOperationsInput | number
  }

  export type EventLogUpdateWithoutMatchInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneWithoutEventLogsNestedInput
  }

  export type EventLogUncheckedUpdateWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }

  export type EventLogUncheckedUpdateManyWithoutMatchInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
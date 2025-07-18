/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface LoginDto {
  /**
   * Email адрес пользователя
   * @format email
   * @example "teacher@abai.edu.kz"
   */
  email: string;
  /**
   * Пароль пользователя
   * @minLength 6
   * @example "securePassword123"
   */
  password: string;
  /**
   * Запомнить меня (увеличивает время жизни токена)
   * @default false
   * @example true
   */
  rememberMe?: boolean;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://localhost:3000";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Multi-Tenant ABAI API
 * @version 1.0.0
 * @license MIT (https://opensource.org/licenses/MIT)
 * @baseUrl http://localhost:3000
 * @contact ABAI Support Team <support@abai.edu.kz> (https://abai.edu.kz)
 *
 *
 * # 🎓 Multi-Tenant ABAI - Система управления образовательным процессом
 *
 * ## 📋 Описание
 * Комплексная система для управления образовательным процессом с поддержкой множественной аренды.
 *
 * ## 🚀 Основные возможности
 * - 🔐 JWT аутентификация и авторизация
 * - 👥 Управление пользователями с ролями (ADMIN, TEACHER, STUDENT, PARENT, HR)
 * - 🏫 Управление группами и аудиториями
 * - 📖 Учебные планы и уроки
 * - 📝 Материалы уроков (лекции, видео, тесты, домашние задания)
 * - 📅 Расписание с автоматической проверкой конфликтов
 * - 📊 Электронный журнал с оценками и посещаемостью
 * - 💰 Система платежей с интеграцией родителей
 * - 🤖 AI ассистент с голосовым интерфейсом
 * - 📈 Статистика и аналитика
 *
 * ## 🔑 Аутентификация
 * Для доступа к защищенным эндпоинтам используйте JWT токен в заголовке Authorization:
 * ```
 * Authorization: Bearer <your-jwt-token>
 * ```
 *
 * ## 👤 Роли пользователей
 * - **ADMIN** - полный доступ ко всем функциям системы
 * - **HR** - управление пользователями и отчетами
 * - **TEACHER** - управление уроками, оценками, просмотр журналов
 * - **STUDENT** - просмотр своих оценок, материалов и расписания
 * - **PARENT** - просмотр данных своих детей, оплата обучения
 *
 * ## 📱 Модули системы
 * - **Auth** - Аутентификация и авторизация
 * - **Users** - Управление пользователями
 * - **Groups** - Управление группами студентов
 * - **Classrooms** - Управление аудиториями
 * - **Study Plans** - Учебные планы
 * - **Schedule** - Расписание занятий
 * - **Lessons** - Уроки
 * - **Materials** - Материалы уроков
 * - **Lesson Results** - Электронный журнал
 * - **Students** - Управление студентами
 * - **Teachers** - Управление преподавателями
 * - **Parents** - Управление родителями
 * - **Payments** - Система платежей
 * - **AI Assistant** - AI ассистент с голосовым интерфейсом
 *
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags App
   * @name AppControllerGetHello
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/`,
      method: "GET",
      ...params,
    });

  studyPlans = {
    /**
     * No description
     *
     * @tags StudyPlans
     * @name StudyPlansControllerFindAll
     * @request GET:/study-plans
     * @secure
     */
    studyPlansControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/study-plans`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StudyPlans
     * @name StudyPlansControllerCreate
     * @request POST:/study-plans
     * @secure
     */
    studyPlansControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/study-plans`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StudyPlans
     * @name StudyPlansControllerFindOne
     * @request GET:/study-plans/{id}
     * @secure
     */
    studyPlansControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/study-plans/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StudyPlans
     * @name StudyPlansControllerUpdate
     * @request PATCH:/study-plans/{id}
     * @secure
     */
    studyPlansControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/study-plans/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StudyPlans
     * @name StudyPlansControllerRemove
     * @request DELETE:/study-plans/{id}
     * @secure
     */
    studyPlansControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/study-plans/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  auth = {
    /**
     * @description Аутентификация пользователя в системе. **Доступные роли:** - ADMIN - администратор системы - TEACHER - преподаватель - STUDENT - студент - PARENT - родитель - HR - HR менеджер - FINANCIST - финансист **Пример использования:** ```json { "email": "teacher@abai.edu.kz", "password": "securePassword123" } ```
     *
     * @tags Auth
     * @name AuthControllerLogin
     * @summary Вход в систему
     * @request POST:/auth/login
     */
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * JWT токен для авторизации
           * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVhY2hlckBhYmFpLmVkdS5reiIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.example"
           */
          access_token?: string;
          user?: {
            /** @example 1 */
            id?: number;
            /** @example "teacher@abai.edu.kz" */
            email?: string;
            /** @example "Иван" */
            name?: string;
            /** @example "Петров" */
            surname?: string;
            /** @example "Сергеевич" */
            middlename?: string;
            /** @example "TEACHER" */
            role?:
              | "ADMIN"
              | "TEACHER"
              | "STUDENT"
              | "PARENT"
              | "HR"
              | "FINANCIST";
            /** @example "+7 700 123 45 67" */
            phone?: string;
            /** @example "https://example.com/avatar.jpg" */
            avatar?: string;
          };
        },
        | {
            /** @example 400 */
            statusCode?: number;
            /** @example ["email must be an email","password should not be empty"] */
            message?: string[];
            /** @example "Bad Request" */
            error?: string;
          }
        | {
            /** @example 401 */
            statusCode?: number;
            /** @example "Invalid credentials" */
            message?: string;
            /** @example "Unauthorized" */
            error?: string;
          }
      >({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  lessons = {
    /**
     * No description
     *
     * @tags Lessons
     * @name LessonsControllerCreate
     * @request POST:/lessons
     * @secure
     */
    lessonsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lessons`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lessons
     * @name LessonsControllerFindAll
     * @request GET:/lessons
     * @secure
     */
    lessonsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lessons`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lessons
     * @name LessonsControllerFindOne
     * @request GET:/lessons/{id}
     * @secure
     */
    lessonsControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lessons/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lessons
     * @name LessonsControllerUpdate
     * @request PATCH:/lessons/{id}
     * @secure
     */
    lessonsControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lessons/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lessons
     * @name LessonsControllerRemove
     * @request DELETE:/lessons/{id}
     * @secure
     */
    lessonsControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lessons/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  materials = {
    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerCreate
     * @summary Создать новый материал
     * @request POST:/materials
     * @secure
     */
    materialsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/materials`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerFindAll
     * @summary Получить все материалы
     * @request GET:/materials
     * @secure
     */
    materialsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/materials`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerFindOne
     * @summary Получить материал по ID
     * @request GET:/materials/{id}
     * @secure
     */
    materialsControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/materials/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerUpdate
     * @summary Обновить материал
     * @request PATCH:/materials/{id}
     * @secure
     */
    materialsControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/materials/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerRemove
     * @summary Удалить материал
     * @request DELETE:/materials/{id}
     * @secure
     */
    materialsControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/materials/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerFindByLesson
     * @summary Получить материалы урока
     * @request GET:/materials/lesson/{lessonId}
     * @secure
     */
    materialsControllerFindByLesson: (
      lessonId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/materials/lesson/${lessonId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerCreateLessonMaterials
     * @summary Создать полные материалы для урока (лекция, видео, презентация, тест, ДЗ)
     * @request POST:/materials/lesson/{lessonId}/create-full-materials
     * @secure
     */
    materialsControllerCreateLessonMaterials: (
      lessonId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/materials/lesson/${lessonId}/create-full-materials`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsControllerAttachToLesson
     * @summary Прикрепить материал к уроку
     * @request POST:/materials/{materialId}/attach-to-lesson/{lessonId}
     * @secure
     */
    materialsControllerAttachToLesson: (
      materialId: string,
      lessonId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/materials/${materialId}/attach-to-lesson/${lessonId}`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerCreate
     * @summary Создать нового пользователя (регистрация)
     * @request POST:/users
     * @secure
     */
    usersControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerFindAll
     * @summary Получить всех пользователей
     * @request GET:/users
     * @secure
     */
    usersControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerFindByRole
     * @summary Получить пользователей по роли
     * @request GET:/users/role/{role}
     * @secure
     */
    usersControllerFindByRole: (
      role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN" | "FINANCIST" | "HR",
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/users/role/${role}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerSearchUsers
     * @summary Поиск пользователей
     * @request GET:/users/search
     * @secure
     */
    usersControllerSearchUsers: (
      query: {
        /** Поисковый запрос (имя, фамилия, email, телефон) */
        q: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/users/search`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerGetStatistics
     * @summary Получить статистику пользователей
     * @request GET:/users/statistics
     * @secure
     */
    usersControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerFindOne
     * @summary Получить пользователя по ID
     * @request GET:/users/{id}
     * @secure
     */
    usersControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerUpdate
     * @summary Обновить пользователя
     * @request PATCH:/users/{id}
     * @secure
     */
    usersControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerRemove
     * @summary Удалить пользователя
     * @request DELETE:/users/{id}
     * @secure
     */
    usersControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerChangePassword
     * @summary Изменить пароль пользователя
     * @request POST:/users/{id}/change-password
     * @secure
     */
    usersControllerChangePassword: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${id}/change-password`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
  groups = {
    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerCreate
     * @summary Создать новую группу
     * @request POST:/groups
     * @secure
     */
    groupsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerFindAll
     * @summary Получить все группы
     * @request GET:/groups
     * @secure
     */
    groupsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/groups`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerFindByCourse
     * @summary Получить группы по номеру курса
     * @request GET:/groups/course/{courseNumber}
     * @secure
     */
    groupsControllerFindByCourse: (
      courseNumber: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/groups/course/${courseNumber}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerGetStatistics
     * @summary Получить статистику по группам
     * @request GET:/groups/statistics
     * @secure
     */
    groupsControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/groups/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerFindOne
     * @summary Получить группу по ID
     * @request GET:/groups/{id}
     * @secure
     */
    groupsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerUpdate
     * @summary Обновить группу
     * @request PATCH:/groups/{id}
     * @secure
     */
    groupsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerRemove
     * @summary Удалить группу
     * @request DELETE:/groups/{id}
     * @secure
     */
    groupsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerGetGroupSchedule
     * @summary Получить расписание группы
     * @request GET:/groups/{id}/schedule
     * @secure
     */
    groupsControllerGetGroupSchedule: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${id}/schedule`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerGetGroupStudyPlans
     * @summary Получить учебные планы группы
     * @request GET:/groups/{id}/study-plans
     * @secure
     */
    groupsControllerGetGroupStudyPlans: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${id}/study-plans`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerAddStudentToGroup
     * @summary Добавить студента в группу
     * @request POST:/groups/{groupId}/students/{studentId}
     * @secure
     */
    groupsControllerAddStudentToGroup: (
      studentId: any,
      groupId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/groups/${groupId}/students/${studentId}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsControllerRemoveStudentFromGroup
     * @summary Исключить студента из группы
     * @request DELETE:/groups/students/{studentId}
     * @secure
     */
    groupsControllerRemoveStudentFromGroup: (
      studentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/groups/students/${studentId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  homework = {
    /**
     * No description
     *
     * @tags Homework
     * @name HomeworkControllerCreate
     * @request POST:/homework
     */
    homeworkControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/homework`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Homework
     * @name HomeworkControllerFindAll
     * @request GET:/homework
     */
    homeworkControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/homework`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Homework
     * @name HomeworkControllerFindOne
     * @request GET:/homework/{id}
     */
    homeworkControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/homework/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Homework
     * @name HomeworkControllerUpdate
     * @request PATCH:/homework/{id}
     */
    homeworkControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/homework/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Homework
     * @name HomeworkControllerRemove
     * @request DELETE:/homework/{id}
     */
    homeworkControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/homework/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  quiz = {
    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerCreate
     * @summary Создать новый тест
     * @request POST:/quiz
     * @secure
     */
    quizControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quiz`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerFindAll
     * @summary Получить все тесты с пагинацией
     * @request GET:/quiz
     * @secure
     */
    quizControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerFindActive
     * @summary Получить активные тесты
     * @request GET:/quiz/active
     * @secure
     */
    quizControllerFindActive: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/active`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerGetMySubmissions
     * @summary Получить мои результаты тестов (для студентов)
     * @request GET:/quiz/my-submissions
     * @secure
     */
    quizControllerGetMySubmissions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/my-submissions`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerFindOne
     * @summary Получить тест по ID
     * @request GET:/quiz/{id}
     * @secure
     */
    quizControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quiz/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerUpdate
     * @summary Обновить тест
     * @request PATCH:/quiz/{id}
     * @secure
     */
    quizControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quiz/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerRemove
     * @summary Удалить тест
     * @request DELETE:/quiz/{id}
     * @secure
     */
    quizControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quiz/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerGetQuestions
     * @summary Получить вопросы теста
     * @request GET:/quiz/{id}/questions
     * @secure
     */
    quizControllerGetQuestions: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/${id}/questions`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerAddQuestion
     * @summary Добавить вопрос к тесту
     * @request POST:/quiz/{id}/questions
     * @secure
     */
    quizControllerAddQuestion: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/${id}/questions`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerGetSubmissions
     * @summary Получить все результаты теста
     * @request GET:/quiz/{id}/submissions
     * @secure
     */
    quizControllerGetSubmissions: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/${id}/submissions`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerSubmitQuiz
     * @summary Отправить ответы на тест
     * @request POST:/quiz/{id}/submit
     * @secure
     */
    quizControllerSubmitQuiz: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/quiz/${id}/submit`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerGetStatistics
     * @summary Получить статистику по тесту
     * @request GET:/quiz/{id}/statistics
     * @secure
     */
    quizControllerGetStatistics: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/${id}/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerToggleActive
     * @summary Активировать/деактивировать тест
     * @request PATCH:/quiz/{id}/activate
     * @secure
     */
    quizControllerToggleActive: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/quiz/${id}/activate`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quizzes
     * @name QuizControllerRemoveQuestion
     * @summary Удалить вопрос
     * @request DELETE:/quiz/questions/{questionId}
     * @secure
     */
    quizControllerRemoveQuestion: (
      questionId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/quiz/questions/${questionId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  classrooms = {
    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerCreate
     * @summary Создать новую аудиторию
     * @request POST:/classrooms
     * @secure
     */
    classroomsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/classrooms`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindAll
     * @summary Получить все аудитории
     * @request GET:/classrooms
     * @secure
     */
    classroomsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/classrooms`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindByBuilding
     * @summary Получить аудитории по зданию
     * @request GET:/classrooms/building/{building}
     * @secure
     */
    classroomsControllerFindByBuilding: (
      building: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/classrooms/building/${building}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindByType
     * @summary Получить аудитории по типу
     * @request GET:/classrooms/type/{type}
     * @secure
     */
    classroomsControllerFindByType: (
      type: "LECTURE" | "PRACTICE" | "COMPUTER" | "LABORATORY" | "OTHER",
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/classrooms/type/${type}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindByCapacity
     * @summary Найти аудитории по вместимости
     * @request GET:/classrooms/capacity/{minCapacity}
     * @secure
     */
    classroomsControllerFindByCapacity: (
      minCapacity: any,
      query?: {
        /** Максимальная вместимость */
        maxCapacity?: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/classrooms/capacity/${minCapacity}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindAvailableClassrooms
     * @summary Найти свободные аудитории на указанное время
     * @request GET:/classrooms/available/{dayOfWeek}/{startTime}/{endTime}
     * @secure
     */
    classroomsControllerFindAvailableClassrooms: (
      endTime: any,
      startTime: any,
      dayOfWeek: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/classrooms/available/${dayOfWeek}/${startTime}/${endTime}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindByEquipment
     * @summary Найти аудитории по оборудованию
     * @request POST:/classrooms/by-equipment
     * @secure
     */
    classroomsControllerFindByEquipment: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/classrooms/by-equipment`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerGetStatistics
     * @summary Получить статистику по аудиториям
     * @request GET:/classrooms/statistics
     * @secure
     */
    classroomsControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/classrooms/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerFindOne
     * @summary Получить аудиторию по ID
     * @request GET:/classrooms/{id}
     * @secure
     */
    classroomsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/classrooms/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerUpdate
     * @summary Обновить аудиторию
     * @request PATCH:/classrooms/{id}
     * @secure
     */
    classroomsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/classrooms/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Classrooms
     * @name ClassroomsControllerRemove
     * @summary Удалить аудиторию
     * @request DELETE:/classrooms/{id}
     * @secure
     */
    classroomsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/classrooms/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  schedule = {
    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerCreate
     * @summary Создать новое расписание
     * @request POST:/schedule
     * @secure
     */
    scheduleControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/schedule`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindAll
     * @summary Получить все расписания
     * @request GET:/schedule
     * @secure
     */
    scheduleControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/schedule`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindByGroup
     * @summary Получить расписание группы
     * @request GET:/schedule/group/{groupId}
     * @secure
     */
    scheduleControllerFindByGroup: (groupId: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/schedule/group/${groupId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindByTeacher
     * @summary Получить расписание преподавателя
     * @request GET:/schedule/teacher/{teacherId}
     * @secure
     */
    scheduleControllerFindByTeacher: (
      teacherId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/schedule/teacher/${teacherId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindByClassroom
     * @summary Получить расписание аудитории
     * @request GET:/schedule/classroom/{classroomId}
     * @secure
     */
    scheduleControllerFindByClassroom: (
      classroomId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/schedule/classroom/${classroomId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindByDayOfWeek
     * @summary Получить расписание на день недели
     * @request GET:/schedule/day/{dayOfWeek}
     * @secure
     */
    scheduleControllerFindByDayOfWeek: (
      dayOfWeek: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/schedule/day/${dayOfWeek}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerFindOne
     * @summary Получить расписание по ID
     * @request GET:/schedule/{id}
     * @secure
     */
    scheduleControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/schedule/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerUpdate
     * @summary Обновить расписание
     * @request PATCH:/schedule/{id}
     * @secure
     */
    scheduleControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/schedule/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Schedule
     * @name ScheduleControllerRemove
     * @summary Удалить расписание
     * @request DELETE:/schedule/{id}
     * @secure
     */
    scheduleControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/schedule/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  students = {
    /**
     * @description Создает запись студента, связывая пользователя с ролью STUDENT с группой. **Требования:** - Пользователь должен существовать и иметь роль STUDENT - Группа должна существовать - Пользователь не должен быть уже зачислен как студент
     *
     * @tags Students
     * @name StudentsControllerCreate
     * @summary Зачислить пользователя как студента
     * @request POST:/students
     * @secure
     */
    studentsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerFindAll
     * @summary Получить всех студентов
     * @request GET:/students
     * @secure
     */
    studentsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/students`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerFindByGroup
     * @summary Получить студентов группы
     * @request GET:/students/group/{groupId}
     * @secure
     */
    studentsControllerFindByGroup: (groupId: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/group/${groupId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerFindByUser
     * @summary Получить запись студента по ID пользователя
     * @request GET:/students/user/{userId}
     * @secure
     */
    studentsControllerFindByUser: (userId: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/user/${userId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerGetStudentGrades
     * @summary Получить все оценки студента по предметам
     * @request GET:/students/{id}/grades
     * @secure
     */
    studentsControllerGetStudentGrades: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/${id}/grades`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerGetStatistics
     * @summary Получить статистику студентов
     * @request GET:/students/statistics
     * @secure
     */
    studentsControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/students/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerFindOne
     * @summary Получить студента по ID
     * @request GET:/students/{id}
     * @secure
     */
    studentsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerUpdate
     * @summary Обновить данные студента
     * @request PATCH:/students/{id}
     * @secure
     */
    studentsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerRemove
     * @summary Отчислить студента
     * @request DELETE:/students/{id}
     * @secure
     */
    studentsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/students/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerChangeGroup
     * @summary Перевести студента в другую группу
     * @request PATCH:/students/{id}/change-group/{newGroupId}
     * @secure
     */
    studentsControllerChangeGroup: (
      newGroupId: any,
      id: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/students/${id}/change-group/${newGroupId}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerAddParentToStudent
     * @summary Привязать родителя к студенту
     * @request POST:/students/{id}/parents/{parentId}
     * @secure
     */
    studentsControllerAddParentToStudent: (
      parentId: any,
      id: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/students/${id}/parents/${parentId}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerRemoveParentFromStudent
     * @summary Отвязать родителя от студента
     * @request DELETE:/students/{id}/parents/{parentId}
     * @secure
     */
    studentsControllerRemoveParentFromStudent: (
      parentId: any,
      id: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/students/${id}/parents/${parentId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Students
     * @name StudentsControllerGetStudentParents
     * @summary Получить всех родителей студента
     * @request GET:/students/{id}/parents
     * @secure
     */
    studentsControllerGetStudentParents: (
      id: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/students/${id}/parents`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  teachers = {
    /**
     * No description
     *
     * @tags Teachers
     * @name TeachersControllerCreate
     * @request POST:/teachers
     */
    teachersControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teachers`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Teachers
     * @name TeachersControllerFindAll
     * @request GET:/teachers
     */
    teachersControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teachers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Teachers
     * @name TeachersControllerFindOne
     * @request GET:/teachers/{id}
     */
    teachersControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teachers/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Teachers
     * @name TeachersControllerUpdate
     * @request PATCH:/teachers/{id}
     */
    teachersControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teachers/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Teachers
     * @name TeachersControllerRemove
     * @request DELETE:/teachers/{id}
     */
    teachersControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/teachers/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  parents = {
    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerCreate
     * @summary Зарегистрировать пользователя как родителя
     * @request POST:/parents
     * @secure
     */
    parentsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/parents`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerFindAll
     * @summary Получить всех родителей
     * @request GET:/parents
     * @secure
     */
    parentsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/parents`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerFindByUser
     * @summary Получить запись родителя по ID пользователя
     * @request GET:/parents/user/{userId}
     * @secure
     */
    parentsControllerFindByUser: (userId: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/parents/user/${userId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerSearch
     * @summary Поиск родителей
     * @request GET:/parents/search
     * @secure
     */
    parentsControllerSearch: (
      query: {
        /** Поисковый запрос */
        q: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/parents/search`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerGetStatistics
     * @summary Получить статистику родителей
     * @request GET:/parents/statistics
     * @secure
     */
    parentsControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/parents/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerFindOne
     * @summary Получить родителя по ID
     * @request GET:/parents/{id}
     * @secure
     */
    parentsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/parents/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerUpdate
     * @summary Обновить данные родителя
     * @request PATCH:/parents/{id}
     * @secure
     */
    parentsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/parents/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Parents
     * @name ParentsControllerRemove
     * @summary Удалить родителя
     * @request DELETE:/parents/{id}
     * @secure
     */
    parentsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/parents/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  payments = {
    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerCreate
     * @summary Создать новый платеж
     * @request POST:/payments
     * @secure
     */
    paymentsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerFindAll
     * @summary Получить все платежи
     * @request GET:/payments
     * @secure
     */
    paymentsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerFindByStudent
     * @summary Получить платежи студента
     * @request GET:/payments/student/{studentId}
     * @secure
     */
    paymentsControllerFindByStudent: (
      studentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/payments/student/${studentId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerGetStudentSummary
     * @summary Получить сводку платежей студента
     * @request GET:/payments/student/{studentId}/summary
     * @secure
     */
    paymentsControllerGetStudentSummary: (
      studentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/payments/student/${studentId}/summary`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerFindByStatus
     * @summary Получить платежи по статусу
     * @request GET:/payments/status/{status}
     * @secure
     */
    paymentsControllerFindByStatus: (status: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/status/${status}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerSearch
     * @summary Поиск платежей
     * @request GET:/payments/search
     * @secure
     */
    paymentsControllerSearch: (
      query: {
        /** Поисковый запрос */
        q: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/payments/search`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerGetStatistics
     * @summary Получить статистику платежей
     * @request GET:/payments/statistics
     * @secure
     */
    paymentsControllerGetStatistics: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/statistics`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerFindOne
     * @summary Получить платеж по ID
     * @request GET:/payments/{id}
     * @secure
     */
    paymentsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerUpdate
     * @summary Обновить платеж
     * @request PATCH:/payments/{id}
     * @secure
     */
    paymentsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerRemove
     * @summary Удалить платеж
     * @request DELETE:/payments/{id}
     * @secure
     */
    paymentsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerProcess
     * @summary Обработать платеж
     * @request PATCH:/payments/{id}/process
     * @secure
     */
    paymentsControllerProcess: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}/process`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerComplete
     * @summary Завершить платеж
     * @request PATCH:/payments/{id}/complete
     * @secure
     */
    paymentsControllerComplete: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}/complete`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerFail
     * @summary Отметить платеж как неуспешный
     * @request PATCH:/payments/{id}/fail
     * @secure
     */
    paymentsControllerFail: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/payments/${id}/fail`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerAssignToParent
     * @summary Назначить платеж родителю
     * @request PATCH:/payments/{id}/assign-parent/{parentId}
     * @secure
     */
    paymentsControllerAssignToParent: (
      parentId: any,
      id: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/payments/${id}/assign-parent/${parentId}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerGetParentPayments
     * @summary Получить все платежи родителя (за всех детей)
     * @request GET:/payments/parent/{parentId}
     * @secure
     */
    paymentsControllerGetParentPayments: (
      parentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/payments/parent/${parentId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerCreatePaymentByParent
     * @summary Создать платеж родителем за своего ребенка
     * @request POST:/payments/parent/{parentId}/student/{studentId}
     * @secure
     */
    paymentsControllerCreatePaymentByParent: (
      studentId: any,
      parentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/payments/parent/${parentId}/student/${studentId}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerPayByParent
     * @summary Оплатить платеж родителем
     * @request PATCH:/payments/{id}/pay-by-parent/{parentId}
     * @secure
     */
    paymentsControllerPayByParent: (
      parentId: any,
      id: any,
      query?: {
        /** Метод оплаты */
        method?: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/payments/${id}/pay-by-parent/${parentId}`,
        method: "PATCH",
        query: query,
        secure: true,
        ...params,
      }),
  };
  notifications = {
    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerCreate
     * @summary Создать уведомление
     * @request POST:/notifications
     * @secure
     */
    notificationsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerFindAll
     * @summary Получить все уведомления с пагинацией
     * @request GET:/notifications
     * @secure
     */
    notificationsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerAddNotifications
     * @summary Добавить уведомления для пользователей
     * @request POST:/notifications/add
     * @secure
     */
    notificationsControllerAddNotifications: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/add`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerGetMyNotifications
     * @summary Получить мои уведомления
     * @request GET:/notifications/my
     * @secure
     */
    notificationsControllerGetMyNotifications: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/my`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerGetUnreadCount
     * @summary Получить количество непрочитанных уведомлений
     * @request GET:/notifications/unread-count/{userId}
     * @secure
     */
    notificationsControllerGetUnreadCount: (
      userId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications/unread-count/${userId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerStreamNotifications
     * @summary SSE поток уведомлений (без авторизации)
     * @request GET:/notifications/stream
     * @secure
     */
    notificationsControllerStreamNotifications: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/stream`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerFindOne
     * @summary Получить уведомление по ID
     * @request GET:/notifications/{id}
     * @secure
     */
    notificationsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/notifications/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerUpdate
     * @summary Обновить уведомление
     * @request PATCH:/notifications/{id}
     * @secure
     */
    notificationsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/notifications/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerRemove
     * @summary Удалить уведомление
     * @request DELETE:/notifications/{id}
     * @secure
     */
    notificationsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/notifications/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerMarkAsRead
     * @summary Отметить уведомление как прочитанное
     * @request PATCH:/notifications/{id}/read
     * @secure
     */
    notificationsControllerMarkAsRead: (id: any, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/notifications/${id}/read`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsControllerMarkAllAsRead
     * @summary Отметить все уведомления как прочитанные
     * @request PATCH:/notifications/read-all/{userId}
     * @secure
     */
    notificationsControllerMarkAllAsRead: (
      userId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/notifications/read-all/${userId}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),
  };
  files = {
    /**
     * No description
     *
     * @tags Files
     * @name FilesControllerCreate
     * @request POST:/files
     */
    filesControllerCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Files
     * @name FilesControllerFindAll
     * @request GET:/files
     */
    filesControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Files
     * @name FilesControllerFindOne
     * @request GET:/files/{id}
     */
    filesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Files
     * @name FilesControllerUpdate
     * @request PATCH:/files/{id}
     */
    filesControllerUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Files
     * @name FilesControllerRemove
     * @request DELETE:/files/{id}
     */
    filesControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  lessonResults = {
    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerCreate
     * @summary Выставить оценку или отметить посещаемость
     * @request POST:/lesson-results
     * @secure
     */
    lessonResultsControllerCreate: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/lesson-results`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerFindAll
     * @summary Получить все результаты уроков
     * @request GET:/lesson-results
     * @secure
     */
    lessonResultsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/lesson-results`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerGetJournalByLesson
     * @summary Получить журнал по уроку (все студенты и их оценки)
     * @request GET:/lesson-results/lesson/{lessonId}/journal
     * @secure
     */
    lessonResultsControllerGetJournalByLesson: (
      lessonId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/lesson-results/lesson/${lessonId}/journal`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerGetStudentGradesBySubject
     * @summary Получить все оценки студента по предмету
     * @request GET:/lesson-results/student/{studentId}/subject/{studyPlanId}/grades
     * @secure
     */
    lessonResultsControllerGetStudentGradesBySubject: (
      studyPlanId: any,
      studentId: any,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/lesson-results/student/${studentId}/subject/${studyPlanId}/grades`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerGetGroupJournalByPeriod
     * @summary Получить журнал группы за период
     * @request GET:/lesson-results/group/{groupId}/journal
     * @secure
     */
    lessonResultsControllerGetGroupJournalByPeriod: (
      groupId: any,
      query: {
        /** Дата окончания периода (YYYY-MM-DD) */
        endDate: any;
        /** Дата начала периода (YYYY-MM-DD) */
        startDate: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/lesson-results/group/${groupId}/journal`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerBulkMarkAttendance
     * @summary Массово отметить посещаемость урока
     * @request POST:/lesson-results/lesson/{lessonId}/bulk-attendance
     * @secure
     */
    lessonResultsControllerBulkMarkAttendance: (
      lessonId: any,
      data: {
        attendanceData: {
          /** ID студента */
          studentId: number;
          /** Присутствовал ли студент */
          attendance: boolean;
          /** Причина отсутствия */
          absentReason?: "SICK" | "FAMILY" | "OTHER";
          /** Комментарий к отсутствию */
          absentComment?: string;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/lesson-results/lesson/${lessonId}/bulk-attendance`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerGetAttendanceStatistics
     * @summary Получить статистику посещаемости
     * @request GET:/lesson-results/attendance/statistics
     * @secure
     */
    lessonResultsControllerGetAttendanceStatistics: (
      query?: {
        /** Дата окончания периода (YYYY-MM-DD, опционально) */
        endDate?: any;
        /** Дата начала периода (YYYY-MM-DD, опционально) */
        startDate?: any;
        /** ID учебного плана (опционально) */
        studyPlanId?: any;
        /** ID группы (опционально) */
        groupId?: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/lesson-results/attendance/statistics`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerFindOne
     * @summary Получить результат урока по ID
     * @request GET:/lesson-results/{id}
     * @secure
     */
    lessonResultsControllerFindOne: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/lesson-results/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerUpdate
     * @summary Обновить результат урока (изменить оценку или посещаемость)
     * @request PATCH:/lesson-results/{id}
     * @secure
     */
    lessonResultsControllerUpdate: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/lesson-results/${id}`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Electronic Journal
     * @name LessonResultsControllerRemove
     * @summary Удалить результат урока
     * @request DELETE:/lesson-results/{id}
     * @secure
     */
    lessonResultsControllerRemove: (id: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/lesson-results/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  aiAssistant = {
    /**
     * No description
     *
     * @tags AI Assistant
     * @name AiAssistantControllerCreateSession
     * @summary Создать ephemeral token для OpenAI Realtime API
     * @request POST:/ai-assistant/session
     * @secure
     */
    aiAssistantControllerCreateSession: (params: RequestParams = {}) =>
      this.request<
        {
          client_secret?: {
            /** Ephemeral token */
            value?: string;
            /** Время истечения токена (Unix timestamp) */
            expires_at?: number;
          };
        },
        any
      >({
        path: `/ai-assistant/session`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}

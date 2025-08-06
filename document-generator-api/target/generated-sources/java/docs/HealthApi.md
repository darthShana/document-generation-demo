# HealthApi

All URIs are relative to *http://localhost:3000*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**healthCheck**](HealthApi.md#healthCheck) | **GET** /health | Health check endpoint |
| [**healthCheckWithHttpInfo**](HealthApi.md#healthCheckWithHttpInfo) | **GET** /health | Health check endpoint |



## healthCheck

> HealthResponse healthCheck()

Health check endpoint

Returns the health status of the document generator service

### Example

```java
// Import classes:
import nz.co.turners.autosure.documentgenerator.ApiClient;
import nz.co.turners.autosure.documentgenerator.ApiException;
import nz.co.turners.autosure.documentgenerator.Configuration;
import nz.co.turners.autosure.documentgenerator.models.*;
import nz.co.turners.autosure.documentgenerator.api.HealthApi;

public class Example {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setBasePath("http://localhost:3000");

        HealthApi apiInstance = new HealthApi(defaultClient);
        try {
            HealthResponse result = apiInstance.healthCheck();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HealthApi#healthCheck");
            System.err.println("Status code: " + e.getCode());
            System.err.println("Reason: " + e.getResponseBody());
            System.err.println("Response headers: " + e.getResponseHeaders());
            e.printStackTrace();
        }
    }
}
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)


### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service is healthy |  -  |

## healthCheckWithHttpInfo

> ApiResponse<HealthResponse> healthCheck healthCheckWithHttpInfo()

Health check endpoint

Returns the health status of the document generator service

### Example

```java
// Import classes:
import nz.co.turners.autosure.documentgenerator.ApiClient;
import nz.co.turners.autosure.documentgenerator.ApiException;
import nz.co.turners.autosure.documentgenerator.ApiResponse;
import nz.co.turners.autosure.documentgenerator.Configuration;
import nz.co.turners.autosure.documentgenerator.models.*;
import nz.co.turners.autosure.documentgenerator.api.HealthApi;

public class Example {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setBasePath("http://localhost:3000");

        HealthApi apiInstance = new HealthApi(defaultClient);
        try {
            ApiResponse<HealthResponse> response = apiInstance.healthCheckWithHttpInfo();
            System.out.println("Status code: " + response.getStatusCode());
            System.out.println("Response headers: " + response.getHeaders());
            System.out.println("Response body: " + response.getData());
        } catch (ApiException e) {
            System.err.println("Exception when calling HealthApi#healthCheck");
            System.err.println("Status code: " + e.getCode());
            System.err.println("Response headers: " + e.getResponseHeaders());
            System.err.println("Reason: " + e.getResponseBody());
            e.printStackTrace();
        }
    }
}
```

### Parameters

This endpoint does not need any parameter.

### Return type

ApiResponse<[**HealthResponse**](HealthResponse.md)>


### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service is healthy |  -  |


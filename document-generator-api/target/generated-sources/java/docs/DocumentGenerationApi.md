# DocumentGenerationApi

All URIs are relative to *http://localhost:3000*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**generateMbiQuote**](DocumentGenerationApi.md#generateMbiQuote) | **POST** /generate/mbi-quote | Generate MBI Quote PDF |
| [**generateMbiQuoteWithHttpInfo**](DocumentGenerationApi.md#generateMbiQuoteWithHttpInfo) | **POST** /generate/mbi-quote | Generate MBI Quote PDF |



## generateMbiQuote

> File generateMbiQuote(mbiQuoteRequest)

Generate MBI Quote PDF

Generates a Mechanical Breakdown Insurance (MBI) quote document in PDF format using the provided quote data and the MBI quote template. 

### Example

```java
// Import classes:
import nz.co.turners.autosure.documentgenerator.ApiClient;
import nz.co.turners.autosure.documentgenerator.ApiException;
import nz.co.turners.autosure.documentgenerator.Configuration;
import nz.co.turners.autosure.documentgenerator.models.*;
import nz.co.turners.autosure.documentgenerator.api.DocumentGenerationApi;

public class Example {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setBasePath("http://localhost:3000");

        DocumentGenerationApi apiInstance = new DocumentGenerationApi(defaultClient);
        MbiQuoteRequest mbiQuoteRequest = new MbiQuoteRequest(); // MbiQuoteRequest | 
        try {
            File result = apiInstance.generateMbiQuote(mbiQuoteRequest);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DocumentGenerationApi#generateMbiQuote");
            System.err.println("Status code: " + e.getCode());
            System.err.println("Reason: " + e.getResponseBody());
            System.err.println("Response headers: " + e.getResponseHeaders());
            e.printStackTrace();
        }
    }
}
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **mbiQuoteRequest** | [**MbiQuoteRequest**](MbiQuoteRequest.md)|  | |

### Return type

[**File**](File.md)


### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/pdf, application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | PDF document generated successfully |  * Content-Disposition - Attachment filename for the generated PDF <br>  |
| **400** | Bad request - invalid or missing data |  -  |
| **500** | Internal server error - PDF generation failed |  -  |

## generateMbiQuoteWithHttpInfo

> ApiResponse<File> generateMbiQuote generateMbiQuoteWithHttpInfo(mbiQuoteRequest)

Generate MBI Quote PDF

Generates a Mechanical Breakdown Insurance (MBI) quote document in PDF format using the provided quote data and the MBI quote template. 

### Example

```java
// Import classes:
import nz.co.turners.autosure.documentgenerator.ApiClient;
import nz.co.turners.autosure.documentgenerator.ApiException;
import nz.co.turners.autosure.documentgenerator.ApiResponse;
import nz.co.turners.autosure.documentgenerator.Configuration;
import nz.co.turners.autosure.documentgenerator.models.*;
import nz.co.turners.autosure.documentgenerator.api.DocumentGenerationApi;

public class Example {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setBasePath("http://localhost:3000");

        DocumentGenerationApi apiInstance = new DocumentGenerationApi(defaultClient);
        MbiQuoteRequest mbiQuoteRequest = new MbiQuoteRequest(); // MbiQuoteRequest | 
        try {
            ApiResponse<File> response = apiInstance.generateMbiQuoteWithHttpInfo(mbiQuoteRequest);
            System.out.println("Status code: " + response.getStatusCode());
            System.out.println("Response headers: " + response.getHeaders());
            System.out.println("Response body: " + response.getData());
        } catch (ApiException e) {
            System.err.println("Exception when calling DocumentGenerationApi#generateMbiQuote");
            System.err.println("Status code: " + e.getCode());
            System.err.println("Response headers: " + e.getResponseHeaders());
            System.err.println("Reason: " + e.getResponseBody());
            e.printStackTrace();
        }
    }
}
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **mbiQuoteRequest** | [**MbiQuoteRequest**](MbiQuoteRequest.md)|  | |

### Return type

ApiResponse<[**File**](File.md)>


### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/pdf, application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | PDF document generated successfully |  * Content-Disposition - Attachment filename for the generated PDF <br>  |
| **400** | Bad request - invalid or missing data |  -  |
| **500** | Internal server error - PDF generation failed |  -  |


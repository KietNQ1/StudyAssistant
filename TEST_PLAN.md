# Test Plan: AI Generate Course from URLs

## Feature Under Test
**Core Feature**: AI-powered course generation from web URLs
- **Endpoint**: `POST /api/Courses/GenerateFromDocuments`
- **Components**: 
  - `CoursesController.GenerateCourseFromDocuments`
  - `WebScraperService.ExtractContentFromUrlsAsync`
  - `VertexAIService.GenerateCourseStructureAsync`

## Test Cases (20 Total)

### A. WebScraperService Tests (7 tests)
1. ExtractContent_ValidUrl_ReturnsSuccessWithContent
2. ExtractContent_MultipleUrls_ProcessesAllUrls
3. ExtractContent_UrlWithMetadata_ExtractsTitleAndDescription
4. ExtractContent_InvalidUrl_ReturnsErrorResult
5. ExtractContent_Http404_ReturnsErrorWithStatusCode
6. ExtractContent_Timeout_ReturnsTimeoutError
7. ExtractContent_NetworkError_HandlesException

### B. CoursesController Tests (8 tests)
8. GenerateCourse_ValidUrls_CreatesCourseSuccessfully
9. GenerateCourse_WithUserGoal_IncorporatesGoalInPrompt
10. GenerateCourse_UrlsAndDocuments_CombinesBothSources
11. GenerateCourse_NoContent_ReturnsBadRequest
12. GenerateCourse_TooManyUrls_ReturnsBadRequest
13. GenerateCourse_Unauthorized_Returns401
14. GenerateCourse_AIFailure_Returns500
15. GenerateCourse_InvalidJsonFromAI_ReturnsBadRequest

### C. Integration Tests (5 tests)
16. Integration_CompleteFlow_CreatesFullCourse
17. Integration_MultipleTopics_CreatesCorrectHierarchy
18. Integration_LongContent_TruncatesAt50k
19. Integration_PartialUrlFailure_ContinuesWithSuccessful
20. Integration_AIResponseWithMarkdown_CleansAndParses

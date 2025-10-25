using myapp.Data;
using myapp.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace myapp
{
    public class CheckRAG
    {
        public static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseSqlite("Data Source=myapp.db");

            using (var context = new ApplicationDbContext(optionsBuilder.Options))
            {
                Console.WriteLine("=== RAG STATUS CHECK ===\n");

                // 1. Check Documents
                var documentsCount = context.Documents.Count();
                Console.WriteLine($"📄 Total Documents: {documentsCount}");

                if (documentsCount > 0)
                {
                    var processedDocs = context.Documents.Where(d => d.ProcessingStatus == "completed").Count();
                    var failedDocs = context.Documents.Where(d => d.ProcessingStatus == "failed").Count();
                    var processingDocs = context.Documents.Where(d => d.ProcessingStatus == "processing").Count();
                    
                    Console.WriteLine($"   ✅ Processed: {processedDocs}");
                    Console.WriteLine($"   ❌ Failed: {failedDocs}");
                    Console.WriteLine($"   ⏳ Processing: {processingDocs}");
                    
                    Console.WriteLine("\n📋 Recent Documents:");
                    var recentDocs = context.Documents
                        .OrderByDescending(d => d.UploadedAt)
                        .Take(5)
                        .Select(d => new { d.Id, d.Title, d.ProcessingStatus, d.PageCount })
                        .ToList();
                    
                    foreach (var doc in recentDocs)
                    {
                        Console.WriteLine($"   ID:{doc.Id} | {doc.Title} | Status:{doc.ProcessingStatus} | Pages:{doc.PageCount}");
                    }
                }

                // 2. Check DocumentChunks
                Console.WriteLine("\n🧩 Document Chunks:");
                var chunksCount = context.DocumentChunks.Count();
                Console.WriteLine($"   Total Chunks: {chunksCount}");

                if (chunksCount > 0)
                {
                    var chunksWithEmbeddings = context.DocumentChunks.Where(dc => dc.EmbeddingVector != null).Count();
                    var chunksWithoutEmbeddings = chunksCount - chunksWithEmbeddings;
                    
                    Console.WriteLine($"   ✅ With Embeddings: {chunksWithEmbeddings}");
                    Console.WriteLine($"   ❌ Without Embeddings: {chunksWithoutEmbeddings}");

                    // Check chunks per document
                    Console.WriteLine("\n📊 Chunks per Document:");
                    var chunksByDoc = context.DocumentChunks
                        .GroupBy(dc => dc.DocumentId)
                        .Select(g => new { DocumentId = g.Key, ChunkCount = g.Count(), WithEmbedding = g.Count(c => c.EmbeddingVector != null) })
                        .ToList();
                    
                    foreach (var group in chunksByDoc)
                    {
                        var docTitle = context.Documents.Where(d => d.Id == group.DocumentId).Select(d => d.Title).FirstOrDefault();
                        Console.WriteLine($"   Doc#{group.DocumentId} ({docTitle}): {group.ChunkCount} chunks, {group.WithEmbedding} with embeddings");
                    }

                    // Show sample chunk
                    var sampleChunk = context.DocumentChunks
                        .Where(dc => dc.EmbeddingVector != null)
                        .OrderByDescending(dc => dc.Id)
                        .FirstOrDefault();
                    
                    if (sampleChunk != null)
                    {
                        Console.WriteLine("\n📝 Sample Chunk:");
                        Console.WriteLine($"   ChunkId: {sampleChunk.Id}");
                        Console.WriteLine($"   DocumentId: {sampleChunk.DocumentId}");
                        Console.WriteLine($"   Content Length: {sampleChunk.Content.Length} chars");
                        Console.WriteLine($"   Embedding Dimension: {sampleChunk.EmbeddingVector.Length}");
                        Console.WriteLine($"   Content Preview: {(sampleChunk.Content.Length > 100 ? sampleChunk.Content.Substring(0, 100) + "..." : sampleChunk.Content)}");
                    }
                }

                // 3. Check ChatSessions with Documents
                Console.WriteLine("\n💬 Chat Sessions:");
                var totalSessions = context.ChatSessions.Count();
                var sessionsWithDocs = context.ChatSessions.Where(cs => cs.DocumentId != null).Count();
                Console.WriteLine($"   Total Sessions: {totalSessions}");
                Console.WriteLine($"   Sessions with Document: {sessionsWithDocs}");
                Console.WriteLine($"   Sessions without Document: {totalSessions - sessionsWithDocs}");

                if (sessionsWithDocs > 0)
                {
                    Console.WriteLine("\n🔗 Sessions with Documents:");
                    var sessionsWithDocDetails = context.ChatSessions
                        .Where(cs => cs.DocumentId != null)
                        .Include(cs => cs.Document)
                        .Take(5)
                        .Select(cs => new { cs.Id, cs.Title, DocumentTitle = cs.Document.Title, cs.DocumentId })
                        .ToList();
                    
                    foreach (var session in sessionsWithDocDetails)
                    {
                        Console.WriteLine($"   Session#{session.Id} '{session.Title}' → Doc#{session.DocumentId} '{session.DocumentTitle}'");
                    }
                }

                // 4. RAG Status Summary
                Console.WriteLine("\n\n=== RAG STATUS SUMMARY ===");
                
                bool hasDocuments = documentsCount > 0;
                bool hasProcessedDocs = context.Documents.Any(d => d.ProcessingStatus == "completed");
                bool hasChunks = chunksCount > 0;
                bool hasEmbeddings = context.DocumentChunks.Any(dc => dc.EmbeddingVector != null);
                bool hasLinkedSessions = sessionsWithDocs > 0;

                Console.WriteLine($"✅ Documents Uploaded: {(hasDocuments ? "YES" : "NO")}");
                Console.WriteLine($"✅ Documents Processed: {(hasProcessedDocs ? "YES" : "NO")}");
                Console.WriteLine($"✅ Chunks Created: {(hasChunks ? "YES" : "NO")}");
                Console.WriteLine($"✅ Embeddings Generated: {(hasEmbeddings ? "YES" : "NO")}");
                Console.WriteLine($"✅ Chat Sessions Linked to Docs: {(hasLinkedSessions ? "YES" : "NO")}");

                Console.WriteLine("\n🎯 RAG IS " + (hasDocuments && hasProcessedDocs && hasChunks && hasEmbeddings ? "WORKING ✅" : "NOT WORKING YET ❌"));

                if (!hasEmbeddings && hasChunks)
                {
                    Console.WriteLine("\n⚠️ WARNING: Chunks exist but no embeddings! Check:");
                    Console.WriteLine("   1. VertexAIService.GenerateEmbeddingAsync() is working");
                    Console.WriteLine("   2. BackgroundJobService is calling GenerateEmbeddingAsync()");
                    Console.WriteLine("   3. Check logs for embedding generation errors");
                }

                if (!hasLinkedSessions && hasDocuments)
                {
                    Console.WriteLine("\n💡 TIP: Create a chat session linked to a document to test RAG:");
                    Console.WriteLine("   1. Go to a course with documents");
                    Console.WriteLine("   2. Start a chat from document page");
                    Console.WriteLine("   3. Ask a question related to the document");
                }
            }
        }
    }
}

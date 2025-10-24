using System;

namespace myapp.Models
{
    /// <summary>
    /// Junction table for many-to-many relationship between ChatSessions and Documents
    /// Allows a chat session to have multiple documents for RAG context
    /// </summary>
    public class ChatSessionDocument
    {
        public int Id { get; set; }
        
        public int ChatSessionId { get; set; }
        public ChatSession ChatSession { get; set; } = null!;
        
        public int DocumentId { get; set; }
        public Document Document { get; set; } = null!;
        
        // When this document was added to the chat
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        
        // Optional: order/priority of documents in chat
        public int DisplayOrder { get; set; } = 0;
    }
}

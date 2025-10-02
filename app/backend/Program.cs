using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var mongoConnectionString = builder.Configuration["Mongo:ConnectionString"] ?? "mongodb://localhost:27017";
var mongoDatabase = builder.Configuration["Mongo:Database"] ?? "ToDoAppDb";
var mongoCollection = builder.Configuration["Mongo:Collection"] ?? "ToDoItems";

builder.Services.AddSingleton<IMongoClient>(new MongoClient(mongoConnectionString));
builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoDatabase).GetCollection<ToDoItem>(mongoCollection);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.MapGet("/api/todos", async (IMongoCollection<ToDoItem> collection) =>
{
    return await collection.Find(_ => true).ToListAsync();
});

app.MapGet("/api/todos/{id}", async (string id, IMongoCollection<ToDoItem> collection) =>
{
    var item = await collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    return item is not null ? Results.Ok(item) : Results.NotFound();
});

app.MapPost("/api/todos", async (ToDoItemDto dto, IMongoCollection<ToDoItem> collection) =>
{
    var item = new ToDoItem { Title = dto.Title, IsCompleted = false };
    await collection.InsertOneAsync(item);
    return Results.Created($"/api/todos/{item.Id}", item);
});

app.MapPut("/api/todos/{id}", async (string id, ToDoItemDto dto, IMongoCollection<ToDoItem> collection) =>
{
    var update = Builders<ToDoItem>.Update
        .Set(x => x.Title, dto.Title)
        .Set(x => x.IsCompleted, dto.IsCompleted);
    var result = await collection.UpdateOneAsync(x => x.Id == id, update);
    return result.MatchedCount > 0 ? Results.NoContent() : Results.NotFound();
});

app.MapDelete("/api/todos/{id}", async (string id, IMongoCollection<ToDoItem> collection) =>
{
    var result = await collection.DeleteOneAsync(x => x.Id == id);
    return result.DeletedCount > 0 ? Results.NoContent() : Results.NotFound();
});

app.Run();

record ToDoItemDto(string Title, bool IsCompleted);

class ToDoItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
}

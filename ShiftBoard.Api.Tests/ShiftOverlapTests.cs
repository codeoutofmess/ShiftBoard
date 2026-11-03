using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ShiftBoard.Api.Controllers;
using ShiftBoard.Api.Data;
using ShiftBoard.Api.Dtos;
using ShiftBoard.Api.Models;

namespace ShiftBoard.Api.Tests;

// Real SQLite (in memory) rather than EF's InMemory provider, so the overlap
// query runs as actual SQL and behaves like production.
public sealed class ShiftOverlapTests : IDisposable
{
    private static readonly DateTime Nine = new(2026, 1, 5, 9, 0, 0);

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly ShiftBoardDbContext _db;

    public ShiftOverlapTests()
    {
        _connection.Open(); // the in-memory DB lives only while this connection is open
        _db = new ShiftBoardDbContext(
            new DbContextOptionsBuilder<ShiftBoardDbContext>().UseSqlite(_connection).Options);
        _db.Database.EnsureCreated();

        _db.Employees.AddRange(
            new Employee { Id = 1, Name = "Sam", Email = "sam@test.local", Role = "Staff", PasswordHash = "x" },
            new Employee { Id = 2, Name = "Jess", Email = "jess@test.local", Role = "Staff", PasswordHash = "x" });
        _db.Locations.Add(new Location { Id = 1, Name = "Cafe" });
        // Existing shift: Sam, 09:00-17:00
        _db.Shifts.Add(new Shift { Id = 1, EmployeeId = 1, LocationId = 1, StartTime = Nine, EndTime = Nine.AddHours(8) });
        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private Task<ActionResult<ShiftResponse>> Create(int employeeId, DateTime start, DateTime end) =>
        new ShiftsController(_db).Create(new ShiftRequest
        {
            EmployeeId = employeeId, LocationId = 1, StartTime = start, EndTime = end,
        });

    [Fact]
    public async Task OverlappingShiftForSameEmployee_ReturnsConflict()
    {
        var result = await Create(1, Nine.AddHours(4), Nine.AddHours(12)); // 13:00-21:00

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Theory]
    [InlineData(8, 12)]   // starts exactly when the existing shift ends (17:00-21:00)
    [InlineData(-4, 0)]   // ends exactly when the existing shift starts (05:00-09:00)
    public async Task BackToBackShift_IsAllowed(int startOffsetHours, int endOffsetHours)
    {
        var result = await Create(1, Nine.AddHours(startOffsetHours), Nine.AddHours(endOffsetHours));

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    [Fact]
    public async Task SameTimeForDifferentEmployee_IsAllowed()
    {
        var result = await Create(2, Nine, Nine.AddHours(8));

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    [Fact]
    public async Task EditingShift_DoesNotConflictWithItself()
    {
        var result = await new ShiftsController(_db).Update(1, new ShiftRequest
        {
            EmployeeId = 1, LocationId = 1, StartTime = Nine.AddHours(1), EndTime = Nine.AddHours(9),
        });

        Assert.IsType<OkObjectResult>(result.Result);
    }
}

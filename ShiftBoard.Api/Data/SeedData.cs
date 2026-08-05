using Microsoft.EntityFrameworkCore;
using ShiftBoard.Api.Models;

namespace ShiftBoard.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(ShiftBoardDbContext db)
    {
        if (await db.Employees.AnyAsync())
        {
            return;
        }

        var admin = new Employee
        {
            Name = "Alex Admin",
            Email = "admin@shiftboard.local",
            Role = "Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
        };
        var staffOne = new Employee
        {
            Name = "Sam Staff",
            Email = "sam@shiftboard.local",
            Role = "Staff",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
        };
        var staffTwo = new Employee
        {
            Name = "Jess Staff",
            Email = "jess@shiftboard.local",
            Role = "Staff",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
        };
        db.Employees.AddRange(admin, staffOne, staffTwo);

        var wellingtonCbd = new Location { Name = "Wellington CBD" };
        var lowerHutt = new Location { Name = "Lower Hutt" };
        db.Locations.AddRange(wellingtonCbd, lowerHutt);

        await db.SaveChangesAsync();

        var monday = StartOfWeek(DateTime.Today);
        db.Shifts.AddRange(
            new Shift
            {
                EmployeeId = staffOne.Id,
                LocationId = wellingtonCbd.Id,
                StartTime = monday.AddHours(9),
                EndTime = monday.AddHours(17),
            },
            new Shift
            {
                EmployeeId = staffTwo.Id,
                LocationId = wellingtonCbd.Id,
                StartTime = monday.AddDays(1).AddHours(9),
                EndTime = monday.AddDays(1).AddHours(17),
            },
            new Shift
            {
                EmployeeId = staffOne.Id,
                LocationId = lowerHutt.Id,
                StartTime = monday.AddDays(2).AddHours(12),
                EndTime = monday.AddDays(2).AddHours(20),
            }
        );

        await db.SaveChangesAsync();
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.AddDays(-diff).Date;
    }
}

using System.ComponentModel.DataAnnotations;
using ShiftBoard.Api.Dtos;

namespace ShiftBoard.Api.Tests;

public class ShiftRequestTests
{
    private static readonly DateTime Start = new(2026, 1, 5, 9, 0, 0);

    private static List<ValidationResult> Validate(DateTime start, DateTime end)
    {
        var request = new ShiftRequest { EmployeeId = 1, LocationId = 1, StartTime = start, EndTime = end };
        return request.Validate(new ValidationContext(request)).ToList();
    }

    [Fact]
    public void EndAfterStart_IsValid() =>
        Assert.Empty(Validate(Start, Start.AddHours(8)));

    [Theory]
    [InlineData(0)]   // zero-length shift
    [InlineData(-1)]  // ends before it starts
    public void EndNotAfterStart_IsRejected(int hoursAfterStart)
    {
        var errors = Validate(Start, Start.AddHours(hoursAfterStart));

        var error = Assert.Single(errors);
        Assert.Contains(nameof(ShiftRequest.EndTime), error.MemberNames);
    }
}

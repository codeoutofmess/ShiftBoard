using System.ComponentModel.DataAnnotations;

namespace ShiftBoard.Api.Dtos;

public class ShiftResponse
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class ShiftRequest : IValidatableObject
{
    [Required]
    public int EmployeeId { get; set; }

    [Required]
    public int LocationId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndTime <= StartTime)
        {
            yield return new ValidationResult(
                "EndTime must be after StartTime.",
                new[] { nameof(EndTime) });
        }
    }
}

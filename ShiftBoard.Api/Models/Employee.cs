using System.ComponentModel.DataAnnotations;

namespace ShiftBoard.Api.Models;

public class Employee
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Role { get; set; } = string.Empty;

    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}

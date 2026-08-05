using System.ComponentModel.DataAnnotations;

namespace ShiftBoard.Api.Models;

public class Location
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}

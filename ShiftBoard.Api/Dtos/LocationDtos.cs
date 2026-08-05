using System.ComponentModel.DataAnnotations;

namespace ShiftBoard.Api.Dtos;

public class LocationResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class LocationRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftBoard.Api.Data;
using ShiftBoard.Api.Dtos;
using ShiftBoard.Api.Models;

namespace ShiftBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocationsController : ControllerBase
{
    private readonly ShiftBoardDbContext _db;

    public LocationsController(ShiftBoardDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocationResponse>>> GetAll()
    {
        var locations = await _db.Locations
            .OrderBy(l => l.Name)
            .Select(l => new LocationResponse { Id = l.Id, Name = l.Name })
            .ToListAsync();

        return Ok(locations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LocationResponse>> GetById(int id)
    {
        var location = await _db.Locations
            .Where(l => l.Id == id)
            .Select(l => new LocationResponse { Id = l.Id, Name = l.Name })
            .SingleOrDefaultAsync();

        if (location is null)
        {
            return NotFound();
        }

        return Ok(location);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<LocationResponse>> Create(LocationRequest request)
    {
        var location = new Location { Name = request.Name };
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var response = new LocationResponse { Id = location.Id, Name = location.Name };
        return CreatedAtAction(nameof(GetById), new { id = location.Id }, response);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<LocationResponse>> Update(int id, LocationRequest request)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location is null)
        {
            return NotFound();
        }

        location.Name = request.Name;
        await _db.SaveChangesAsync();

        return Ok(new LocationResponse { Id = location.Id, Name = location.Name });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location is null)
        {
            return NotFound();
        }

        var hasShifts = await _db.Shifts.AnyAsync(s => s.LocationId == id);
        if (hasShifts)
        {
            return Conflict(new { message = "Cannot delete a location that has shifts assigned to it." });
        }

        _db.Locations.Remove(location);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

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
public class ShiftsController : ControllerBase
{
    private readonly ShiftBoardDbContext _db;

    public ShiftsController(ShiftBoardDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftResponse>>> GetAll(
        [FromQuery] int? employeeId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.Shifts.AsQueryable();

        if (employeeId.HasValue)
        {
            query = query.Where(s => s.EmployeeId == employeeId);
        }

        if (from.HasValue)
        {
            query = query.Where(s => s.EndTime >= from);
        }

        if (to.HasValue)
        {
            query = query.Where(s => s.StartTime <= to);
        }

        var shifts = await query
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                EmployeeId = s.EmployeeId,
                EmployeeName = s.Employee!.Name,
                LocationId = s.LocationId,
                LocationName = s.Location!.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
            })
            .ToListAsync();

        return Ok(shifts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ShiftResponse>> GetById(int id)
    {
        var shift = await _db.Shifts
            .Where(s => s.Id == id)
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                EmployeeId = s.EmployeeId,
                EmployeeName = s.Employee!.Name,
                LocationId = s.LocationId,
                LocationName = s.Location!.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
            })
            .SingleOrDefaultAsync();

        if (shift is null)
        {
            return NotFound();
        }

        return Ok(shift);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ShiftResponse>> Create(ShiftRequest request)
    {
        var employee = await _db.Employees.FindAsync(request.EmployeeId);
        if (employee is null)
        {
            return BadRequest(new { message = "Employee not found." });
        }

        var location = await _db.Locations.FindAsync(request.LocationId);
        if (location is null)
        {
            return BadRequest(new { message = "Location not found." });
        }

        if (await HasOverlapAsync(request.EmployeeId, request.StartTime, request.EndTime, excludeShiftId: null))
        {
            return Conflict(new { message = "This employee already has a shift that overlaps with the requested time." });
        }

        var shift = new Shift
        {
            EmployeeId = request.EmployeeId,
            LocationId = request.LocationId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
        };
        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();

        var response = new ShiftResponse
        {
            Id = shift.Id,
            EmployeeId = shift.EmployeeId,
            EmployeeName = employee.Name,
            LocationId = shift.LocationId,
            LocationName = location.Name,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
        };
        return CreatedAtAction(nameof(GetById), new { id = shift.Id }, response);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ShiftResponse>> Update(int id, ShiftRequest request)
    {
        var shift = await _db.Shifts.FindAsync(id);
        if (shift is null)
        {
            return NotFound();
        }

        var employee = await _db.Employees.FindAsync(request.EmployeeId);
        if (employee is null)
        {
            return BadRequest(new { message = "Employee not found." });
        }

        var location = await _db.Locations.FindAsync(request.LocationId);
        if (location is null)
        {
            return BadRequest(new { message = "Location not found." });
        }

        if (await HasOverlapAsync(request.EmployeeId, request.StartTime, request.EndTime, excludeShiftId: id))
        {
            return Conflict(new { message = "This employee already has a shift that overlaps with the requested time." });
        }

        shift.EmployeeId = request.EmployeeId;
        shift.LocationId = request.LocationId;
        shift.StartTime = request.StartTime;
        shift.EndTime = request.EndTime;
        await _db.SaveChangesAsync();

        return Ok(new ShiftResponse
        {
            Id = shift.Id,
            EmployeeId = shift.EmployeeId,
            EmployeeName = employee.Name,
            LocationId = shift.LocationId,
            LocationName = location.Name,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var shift = await _db.Shifts.FindAsync(id);
        if (shift is null)
        {
            return NotFound();
        }

        _db.Shifts.Remove(shift);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> HasOverlapAsync(int employeeId, DateTime start, DateTime end, int? excludeShiftId)
    {
        return await _db.Shifts.AnyAsync(s =>
            s.EmployeeId == employeeId &&
            (excludeShiftId == null || s.Id != excludeShiftId) &&
            s.StartTime < end &&
            s.EndTime > start);
    }

}

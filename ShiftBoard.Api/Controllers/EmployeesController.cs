using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftBoard.Api.Data;
using ShiftBoard.Api.Dtos;

namespace ShiftBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly ShiftBoardDbContext _db;

    public EmployeesController(ShiftBoardDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeResponse>>> GetAll()
    {
        var employees = await _db.Employees
            .OrderBy(e => e.Name)
            .Select(e => new EmployeeResponse { Id = e.Id, Name = e.Name, Email = e.Email, Role = e.Role })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeResponse>> GetById(int id)
    {
        var employee = await _db.Employees
            .Where(e => e.Id == id)
            .Select(e => new EmployeeResponse { Id = e.Id, Name = e.Name, Email = e.Email, Role = e.Role })
            .SingleOrDefaultAsync();

        if (employee is null)
        {
            return NotFound();
        }

        return Ok(employee);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeeResponse>> Update(int id, UpdateEmployeeRequest request)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null)
        {
            return NotFound();
        }

        var emailTaken = await _db.Employees.AnyAsync(e => e.Id != id && e.Email == request.Email);
        if (emailTaken)
        {
            return Conflict(new { message = "Another employee already uses this email." });
        }

        employee.Name = request.Name;
        employee.Email = request.Email;
        employee.Role = request.Role;
        await _db.SaveChangesAsync();

        return Ok(new EmployeeResponse { Id = employee.Id, Name = employee.Name, Email = employee.Email, Role = employee.Role });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null)
        {
            return NotFound();
        }

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

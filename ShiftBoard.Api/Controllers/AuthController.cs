using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftBoard.Api.Data;
using ShiftBoard.Api.Dtos;
using ShiftBoard.Api.Models;
using ShiftBoard.Api.Services;

namespace ShiftBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ShiftBoardDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthController(ShiftBoardDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var emailExists = await _db.Employees.AnyAsync(e => e.Email == request.Email);
        if (emailExists)
        {
            return Conflict(new { message = "An employee with this email already exists." });
        }

        var employee = new Employee
        {
            Name = request.Name,
            Email = request.Email,
            Role = request.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        return Ok(BuildAuthResponse(employee));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var employee = await _db.Employees.SingleOrDefaultAsync(e => e.Email == request.Email);
        if (employee is null || !BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(BuildAuthResponse(employee));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult Me()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value });
        return Ok(claims);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin-only")]
    public ActionResult AdminOnly()
    {
        return Ok(new { message = $"Hello {User.Identity?.Name}, you have Admin access." });
    }

    private AuthResponse BuildAuthResponse(Employee employee)
    {
        var (token, expiresAt) = _tokenService.GenerateToken(employee);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            EmployeeId = employee.Id,
            Name = employee.Name,
            Email = employee.Email,
            Role = employee.Role,
        };
    }
}

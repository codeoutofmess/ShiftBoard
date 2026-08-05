using ShiftBoard.Api.Models;

namespace ShiftBoard.Api.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) GenerateToken(Employee employee);
}

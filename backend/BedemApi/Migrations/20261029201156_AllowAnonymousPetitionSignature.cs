using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AllowAnonymousPetitionSignature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "PetitionSignatures",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "PetitionSignatures",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PasswordHash", "SecurityStamp" },
                values: new object[] { "$2a$11$2nqmzz1pl1Ig8G59xtYG3.hEauPA0BdaLB16xfcZIkTRh/OMPBmCu", "ecf3d286616d4f8490d5ffbc261d02f7" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "PetitionSignatures");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "PetitionSignatures",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PasswordHash", "SecurityStamp" },
                values: new object[] { "$2a$11$Q1ux0Wf0epzn41slv46zgOlFZd.LZ50nQId3236ba25RT4Yc5yNQu", "2c24c2c507e8431f8dc431f2f223ed9d" });
        }
    }
}

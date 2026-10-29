using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFirstLastName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FirstName", "LastName", "PasswordHash", "SecurityStamp" },
                values: new object[] { "", "", "$2a$11$Q1ux0Wf0epzn41slv46zgOlFZd.LZ50nQId3236ba25RT4Yc5yNQu", "2c24c2c507e8431f8dc431f2f223ed9d" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PasswordHash", "SecurityStamp" },
                values: new object[] { "$2a$11$BTbqNCoOAWfp9uJ2.Ln5ce3DnF4HzeW8dSYNfal7uMCBX8jZ2Rwpa", "9785a3de82cb411a96bd6d81708cb9f2" });
        }
    }
}

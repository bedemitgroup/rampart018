using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAssemblySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuorumRequired",
                table: "AssemblySessions");

            migrationBuilder.AddColumn<int>(
                name: "PresentAtClose",
                table: "AssemblyTopics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "QuorumMetAtClose",
                table: "AssemblyTopics",
                type: "boolean",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssemblySettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QuorumPercent = table.Column<int>(type: "integer", nullable: false),
                    MajorityRule = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssemblySettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssemblySettings_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AssemblySettings",
                columns: new[] { "Id", "MajorityRule", "QuorumPercent", "UpdatedAt", "UpdatedByUserId" },
                values: new object[] { 1, "Datih glasova", 50, null, null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Q4d0PsLTCyWrkoQAYwVqBuV0IIOBeLdG.RnmYfFOu.5CJAGprjMQm");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblySettings_UpdatedByUserId",
                table: "AssemblySettings",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssemblySettings");

            migrationBuilder.DropColumn(
                name: "PresentAtClose",
                table: "AssemblyTopics");

            migrationBuilder.DropColumn(
                name: "QuorumMetAtClose",
                table: "AssemblyTopics");

            migrationBuilder.AddColumn<int>(
                name: "QuorumRequired",
                table: "AssemblySessions",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$1yPfcVvZKTaSFUhBZVZuPuv5uLIdlM5Wr7XVmhiXjx63lNLW6AQg2");
        }
    }
}
